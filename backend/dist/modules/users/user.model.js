"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../database");
class User extends sequelize_1.Model {
    toSafeJSON() {
        const raw = this.get({ plain: true });
        const { password_hash: _ignored, ...safeUser } = raw;
        return safeUser;
    }
    toJSON() {
        return this.toSafeJSON();
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(180),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password_hash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'student'),
        allowNull: false,
        defaultValue: 'student',
    },
    classification: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
    },
    last_activity_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    created_at: sequelize_1.DataTypes.DATE,
    updated_at: sequelize_1.DataTypes.DATE,
    deleted_at: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
    modelName: 'User',
    ...database_1.PARANOID_MODEL_OPTIONS,
});
//# sourceMappingURL=user.model.js.map