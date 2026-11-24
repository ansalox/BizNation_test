"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportAlert = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../database");
class SupportAlert extends sequelize_1.Model {
}
exports.SupportAlert = SupportAlert;
SupportAlert.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    webhook_event_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    external_event_id: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    sender: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
        defaultValue: null,
    },
    message_text: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    intent: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    sentiment: {
        type: sequelize_1.DataTypes.ENUM('positive', 'neutral', 'negative'),
        allowNull: false,
        defaultValue: 'neutral',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'low',
    },
    score: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    matched_keywords: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    requires_attention: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('open', 'reviewed', 'resolved'),
        allowNull: false,
        defaultValue: 'open',
    },
    created_at: sequelize_1.DataTypes.DATE,
    updated_at: sequelize_1.DataTypes.DATE,
    deleted_at: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
    tableName: 'support_alerts',
    modelName: 'SupportAlert',
    ...database_1.PARANOID_MODEL_OPTIONS,
});
//# sourceMappingURL=supportAlert.model.js.map