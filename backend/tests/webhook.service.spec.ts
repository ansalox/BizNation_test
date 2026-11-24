import { UniqueConstraintError } from 'sequelize';
import { describe, expect, it, vi } from 'vitest';
import { SupportAlert, WebhookEvent } from '../src/database/models';
import { WebhookService } from '../src/modules/webhooks/webhook.service';

describe('WebhookService (Unit & Idempotency Tests)', () => {
  const service = new WebhookService();

  it('inserts a new webhook event once and marks it processed', async () => {
    const store = new Map<string, WebhookEvent>();

    const findOneSpy = vi
      .spyOn(WebhookEvent, 'findOne')
      .mockImplementation(async (options) => {
        const where = options?.where as { external_event_id?: string } | undefined;
        const id = where?.external_event_id;
        return id ? (store.get(id) ?? null) : null;
      });

    const createSpy = vi
      .spyOn(WebhookEvent, 'create')
      .mockImplementation(async (values: Record<string, unknown>) => {
        const record = {
          id: '50000000-0000-4000-8000-000000000010',
          ...values,
          update: vi.fn().mockImplementation(async function (this: Record<string, unknown>, patch) {
            Object.assign(this, patch);
            return this;
          }),
        } as unknown as WebhookEvent;
        store.set(String(values.external_event_id), record);
        return record;
      });

    const createAlertSpy = vi
      .spyOn(SupportAlert, 'create')
      .mockResolvedValueOnce({ id: 'alert-1' } as SupportAlert);

    const payload = {
      external_event_id: 'wamid_unique_001',
      event_type: 'message.received',
      data: { text: 'Hola BizNation' },
    };

    const firstResult = await service.processWhatsAppEvent(payload);
    const secondResult = await service.processWhatsAppEvent(payload);

    expect(findOneSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createAlertSpy).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(1);

    expect(firstResult.duplicate).toBe(false);
    expect(firstResult.event.status).toBe('processed');

    expect(secondResult.duplicate).toBe(true);
    expect(secondResult.message).toBe('Event already processed');
    expect(secondResult.event.external_event_id).toBe('wamid_unique_001');
  });

  it('handles concurrent duplicate race via UniqueConstraintError without throwing', async () => {
    const existingEvent = {
      id: '50000000-0000-4000-8000-000000000011',
      external_event_id: 'wamid_race_001',
      status: 'processed',
    } as WebhookEvent;

    vi.spyOn(WebhookEvent, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingEvent);
    vi.spyOn(WebhookEvent, 'create').mockRejectedValueOnce(
      new UniqueConstraintError({ message: 'duplicate key' }),
    );

    const result = await service.processWhatsAppEvent({
      external_event_id: 'wamid_race_001',
      event_type: 'message.received',
    });

    expect(result.duplicate).toBe(true);
    expect(result.message).toBe('Event already processed');
    expect(result.event).toBe(existingEvent);
  });

  it('extracts external_event_id from Meta WhatsApp Cloud API nested payload', async () => {
    vi.spyOn(WebhookEvent, 'findOne').mockResolvedValueOnce(null);
    const createSpy = vi
      .spyOn(WebhookEvent, 'create')
      .mockImplementation(async (values: Record<string, unknown>) => {
        return {
          id: '50000000-0000-4000-8000-000000000012',
          ...values,
          update: vi.fn().mockImplementation(async function (this: Record<string, unknown>, patch) {
            Object.assign(this, patch);
            return this;
          }),
        } as unknown as WebhookEvent;
      });

    const metaPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba_account_1',
          changes: [
            {
              field: 'messages',
              value: {
                messages: [{ id: 'wamid.HBgLMjAyNjAwMDE=', type: 'text' }],
              },
            },
          ],
        },
      ],
    };

    const result = await service.processWhatsAppEvent(metaPayload);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        external_event_id: 'wamid.HBgLMjAyNjAwMDE=',
        provider: 'whatsapp_meta',
        event_type: 'messages',
      }),
    );
    expect(result.duplicate).toBe(false);
    expect(result.event.status).toBe('processed');
  });

  it('records failed status and error_log when processing fails', async () => {
    vi.spyOn(WebhookEvent, 'findOne').mockResolvedValueOnce(null);
    vi.spyOn(WebhookEvent, 'create').mockImplementation(async (values: Record<string, unknown>) => {
      return {
        id: '50000000-0000-4000-8000-000000000013',
        ...values,
        update: vi.fn().mockImplementation(async function (this: Record<string, unknown>, patch) {
          Object.assign(this, patch);
          return this;
        }),
      } as unknown as WebhookEvent;
    });

    const result = await service.processWhatsAppEvent({
      external_event_id: 'evt_fail_1',
      event_type: 'message.received',
      simulate_error: true,
      error_message: 'Downstream handler timeout',
    });

    expect(result.duplicate).toBe(false);
    expect(result.event.status).toBe('failed');
    expect(result.event.error_log).toBe('Downstream handler timeout');
  });
});
