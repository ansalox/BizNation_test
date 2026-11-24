"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
class UserService {
    async findAll() {
        const users = await models_1.User.findAll({
            order: [['created_at', 'DESC']],
        });
        return users.map((user) => user.toSafeJSON());
    }
    async findById(id, actor) {
        if (actor && actor.role !== 'admin' && actor.id !== id) {
            throw new errorHandler_1.AppError('Insufficient permissions to view this user', 403, 'FORBIDDEN');
        }
        const user = await models_1.User.findByPk(id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        return user.toSafeJSON();
    }
    async create(input) {
        const email = input.email.trim().toLowerCase();
        const existing = await models_1.User.findOne({ where: { email } });
        if (existing) {
            throw new errorHandler_1.AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, env_1.env.bcryptSaltRounds);
        const user = await models_1.User.create({
            name: input.name.trim(),
            email,
            password_hash: passwordHash,
            role: input.role ?? 'student',
            classification: input.classification ?? null,
        });
        return user.toSafeJSON();
    }
    async update(id, input, actor) {
        if (actor && actor.role !== 'admin' && actor.id !== id) {
            throw new errorHandler_1.AppError('Insufficient permissions to update this user', 403, 'FORBIDDEN');
        }
        if (actor && actor.role !== 'admin' && input.role !== undefined) {
            throw new errorHandler_1.AppError('Only administrators can change user roles', 403, 'FORBIDDEN');
        }
        const user = await models_1.User.findByPk(id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const updates = {};
        if (input.name !== undefined) {
            updates.name = input.name.trim();
        }
        if (input.email !== undefined) {
            const normalizedEmail = input.email.trim().toLowerCase();
            if (normalizedEmail !== user.email) {
                const duplicate = await models_1.User.findOne({ where: { email: normalizedEmail } });
                if (duplicate) {
                    throw new errorHandler_1.AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
                }
                updates.email = normalizedEmail;
            }
        }
        if (input.password !== undefined) {
            updates.password_hash = await bcryptjs_1.default.hash(input.password, env_1.env.bcryptSaltRounds);
        }
        if (input.role !== undefined) {
            updates.role = input.role;
        }
        if (input.classification !== undefined) {
            updates.classification = input.classification;
        }
        await user.update(updates);
        return user.toSafeJSON();
    }
    async softDelete(id) {
        const user = await models_1.User.findByPk(id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        await user.destroy();
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map