import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { PARANOID_MODEL_OPTIONS, sequelize } from '../../database';
import type { WebhookEvent } from '../webhooks/webhook.model';

export type AlertPriority = 'low' | 'medium' | 'high';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type AlertStatus = 'open' | 'reviewed' | 'resolved';

export class SupportAlert extends Model<
  InferAttributes<SupportAlert>,
  InferCreationAttributes<SupportAlert>
> {
  declare id: CreationOptional<string>;
  declare webhook_event_id: ForeignKey<string>;
  declare external_event_id: string;
  declare sender: CreationOptional<string | null>;
  declare message_text: string;
  declare intent: string;
  declare sentiment: MessageSentiment;
  declare priority: AlertPriority;
  declare score: number;
  declare matched_keywords: string[];
  declare requires_attention: CreationOptional<boolean>;
  declare status: CreationOptional<AlertStatus>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare readonly deleted_at: CreationOptional<Date | null>;

  declare webhookEvent?: NonAttribute<WebhookEvent>;
}

SupportAlert.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    webhook_event_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    external_event_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sender: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: null,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sentiment: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative'),
      allowNull: false,
      defaultValue: 'neutral',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    matched_keywords: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    requires_attention: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'reviewed', 'resolved'),
      allowNull: false,
      defaultValue: 'open',
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'support_alerts',
    modelName: 'SupportAlert',
    ...PARANOID_MODEL_OPTIONS,
  },
);
