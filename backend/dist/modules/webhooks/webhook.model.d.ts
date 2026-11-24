import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
export type WebhookEventStatus = 'received' | 'processed' | 'failed';
export declare class WebhookEvent extends Model<InferAttributes<WebhookEvent>, InferCreationAttributes<WebhookEvent>> {
    id: CreationOptional<string>;
    external_event_id: string;
    provider: CreationOptional<string>;
    event_type: string;
    payload: Record<string, unknown>;
    status: CreationOptional<WebhookEventStatus>;
    attempts: CreationOptional<number>;
    error_log: CreationOptional<string | null>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
}
