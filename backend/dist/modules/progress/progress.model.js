"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonProgress = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../database");
class LessonProgress extends sequelize_1.Model {
}
exports.LessonProgress = LessonProgress;
LessonProgress.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    course_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    lesson_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    completed_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    created_at: sequelize_1.DataTypes.DATE,
    updated_at: sequelize_1.DataTypes.DATE,
    deleted_at: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
    tableName: 'lesson_progress',
    modelName: 'LessonProgress',
    ...database_1.PARANOID_MODEL_OPTIONS,
});
//# sourceMappingURL=progress.model.js.map