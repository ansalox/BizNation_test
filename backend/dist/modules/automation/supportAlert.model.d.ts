import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import type { WebhookEvent } from '../webhooks/webhook.model';
export type AlertPriority = 'low' | 'medium' | 'high';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type AlertStatus = 'open' | 'reviewed' | 'resolved';
export declare class SupportAlert extends Model<InferAttributes<SupportAlert>, InferCreationAttributes<SupportAlert>> {
    id: CreationOptional<string>;
    webhook_event_id: ForeignKey<string>;
    external_event_id: string;
    sender: CreationOptional<string | null>;
    message_text: string;
    intent: string;
    sentiment: MessageSentiment;
    priority: AlertPriority;
    score: number;
    matched_keywords: string[];
    requires_attention: CreationOptional<boolean>;
    status: CreationOptional<AlertStatus>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
    webhookEvent?: NonAttribute<WebhookEvent>;
}
