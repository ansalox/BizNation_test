"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../database");
class WebhookEvent extends sequelize_1.Model {
}
exports.WebhookEvent = WebhookEvent;
WebhookEvent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    external_event_id: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    provider: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'whatsapp_meta',
    },
    event_type: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    payload: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('received', 'processed', 'failed'),
        allowNull: false,
        defaultValue: 'received',
    },
    attempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    error_log: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    created_at: sequelize_1.DataTypes.DATE,
    updated_at: sequelize_1.DataTypes.DATE,
    deleted_at: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
    tableName: 'webhook_events',
    modelName: 'WebhookEvent',
    ...database_1.PARANOID_MODEL_OPTIONS,
});
//# sourceMappingURL=webhook.model.js.map