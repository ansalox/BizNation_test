"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../database");
class Lesson extends sequelize_1.Model {
}
exports.Lesson = Lesson;
Lesson.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    course_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    },
    order_index: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    created_at: sequelize_1.DataTypes.DATE,
    updated_at: sequelize_1.DataTypes.DATE,
    deleted_at: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
    tableName: 'lessons',
    modelName: 'Lesson',
    ...database_1.PARANOID_MODEL_OPTIONS,
});
//# sourceMappingURL=lesson.model.js.map