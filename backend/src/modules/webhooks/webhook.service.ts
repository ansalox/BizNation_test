import { UniqueConstraintError } from 'sequelize';
import { env } from '../../config/env';
import { WebhookEvent } from '../../database/models';
import { AppError } from '../../middlewares/errorHandler';
import { automationService } from '../automation/automation.service';
import type { SupportAlert } from '../automation/supportAlert.model';
import type { WebhookEventStatus } from './webhook.model';

export interface WhatsAppChallengeInput {
  mode?: string;
  verifyToken?: string;
  challenge?: string;
}

export interface WebhookProcessResult {
  duplicate: boolean;
  message: string;
  event: WebhookEvent;
  alert?: SupportAlert | null;
}

export interface WebhookEventsListQuery {
  page?: number;
  limit?: number;
  status?: WebhookEventStatus;
  provider?: string;
}

export interface PaginatedWebhookEventsResult {
  data: WebhookEvent[];
  total: number;
  page: number;
  totalPages: number;
}

interface MetaEntryChange {
  field?: unknown;
  value?: {
    messages?: Array<{ id?: unknown }>;
    statuses?: Array<{ id?: unknown }>;
  };
}

interface MetaEntry {
  id?: unknown;
  changes?: MetaEntryChange[];
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export class WebhookService {
  verifyWhatsAppChallenge(input: WhatsAppChallengeInput): string {
    if (!input.challenge) {
      throw new AppError('Missing hub.challenge parameter', 400, 'VALIDATION_ERROR');
    }

    if (input.mode !== undefined && input.mode !== 'subscribe') {
      throw new AppError('Invalid hub.mode parameter', 403, 'WEBHOOK_VERIFICATION_FAILED');
    }

    if (!env.webhook.verifyToken || input.verifyToken !== env.webhook.verifyToken) {
      throw new AppError('Invalid hub.verify_token', 403, 'WEBHOOK_VERIFICATION_FAILED');
    }

    return input.challenge;
  }

  private extractEventMetadata(payload: Record<string, unknown>): {
    externalEventId: string;
    eventType: string;
    provider: string;
  } {
    const entries = Array.isArray(payload.entry) ? (payload.entry as MetaEntry[]) : [];
    const firstEntry = entries[0];
    const firstChange = Array.isArray(firstEntry?.changes) ? firstEntry.changes[0] : undefined;

    const externalEventId =
      asNonEmptyString(payload.external_event_id) ??
      asNonEmptyString(payload.event_id) ??
      asNonEmptyString(payload.id) ??
      asNonEmptyString(firstChange?.value?.messages?.[0]?.id) ??
      asNonEmptyString(firstChange?.value?.statuses?.[0]?.id) ??
      asNonEmptyString(firstEntry?.id);

    if (!externalEventId) {
      throw new AppError(
        'Missing external_event_id in webhook payload',
        400,
        'VALIDATION_ERROR',
      );
    }

    const eventType =
      asNonEmptyString(payload.event_type) ??
      asNonEmptyString(payload.type) ??
      asNonEmptyString(firstChange?.field) ??
      asNonEmptyString(payload.object) ??
      'whatsapp.event';

    const provider = asNonEmptyString(payload.provider) ?? 'whatsapp_meta';

    return {
      externalEventId,
      eventType,
      provider,
    };
  }

  async processWhatsAppEvent(
    rawPayload: Record<string, unknown>,
  ): Promise<WebhookProcessResult> {
    const { externalEventId, eventType, provider } = this.extractEventMetadata(rawPayload);

    const existing = await WebhookEvent.findOne({
      where: { external_event_id: externalEventId },
    });

    if (existing) {
      return {
        duplicate: true,
        message: 'Event already processed',
        event: existing,
      };
    }

    let event: WebhookEvent;
    try {
      event = await WebhookEvent.create({
        external_event_id: externalEventId,
        provider,
        event_type: eventType,
        payload: rawPayload,
        status: 'received',
        attempts: 1,
        error_log: null,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const concurrentExisting = await WebhookEvent.findOne({
          where: { external_event_id: externalEventId },
        });
        if (concurrentExisting) {
          return {
            duplicate: true,
            message: 'Event already processed',
            event: concurrentExisting,
          };
        }
      }
      throw error;
    }

    try {
      if (rawPayload.simulate_error === true) {
        throw new Error(
          asNonEmptyString(rawPayload.error_message) ??
            'Simulated webhook processing error',
        );
      }

      await event.update({ status: 'processed' });
      const alert = await automationService.analyzeAndRecordWebhookAlert(event, rawPayload);
      return {
        duplicate: false,
        message: 'Webhook event processed successfully',
        event,
        alert,
      };
    } catch (processingError) {
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown webhook processing error';
      await event.update({
        status: 'failed',
        error_log: errorMessage,
      });

      return {
        duplicate: false,
        message: 'Webhook event recorded with processing failure',
        event,
      };
    }
  }

  async listEvents(
    query: WebhookEventsListQuery = {},
  ): Promise<PaginatedWebhookEventsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.provider) {
      where.provider = query.provider;
    }

    const { rows, count } = await WebhookEvent.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const total = typeof count === 'number' ? count : 0;
    return {
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const webhookService = new WebhookService();
