import { WebhookEvent } from '../../database/models';
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
export declare class WebhookService {
    verifyWhatsAppChallenge(input: WhatsAppChallengeInput): string;
    private extractEventMetadata;
    processWhatsAppEvent(rawPayload: Record<string, unknown>): Promise<WebhookProcessResult>;
    listEvents(query?: WebhookEventsListQuery): Promise<PaginatedWebhookEventsResult>;
}
export declare const webhookService: WebhookService;
