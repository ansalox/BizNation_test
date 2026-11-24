import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { PARANOID_MODEL_OPTIONS, sequelize } from '../../database';

export type WebhookEventStatus = 'received' | 'processed' | 'failed';

export class WebhookEvent extends Model<
  InferAttributes<WebhookEvent>,
  InferCreationAttributes<WebhookEvent>
> {
  declare id: CreationOptional<string>;
  declare external_event_id: string;
  declare provider: CreationOptional<string>;
  declare event_type: string;
  declare payload: Record<string, unknown>;
  declare status: CreationOptional<WebhookEventStatus>;
  declare attempts: CreationOptional<number>;
  declare error_log: CreationOptional<string | null>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare readonly deleted_at: CreationOptional<Date | null>;
}

WebhookEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    external_event_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'whatsapp_meta',
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('received', 'processed', 'failed'),
      allowNull: false,
      defaultValue: 'received',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    error_log: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'webhook_events',
    modelName: 'WebhookEvent',
    ...PARANOID_MODEL_OPTIONS,
  },
);
