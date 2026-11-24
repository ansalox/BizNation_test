"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
class AuthService {
    signToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.secret, {
            expiresIn: env_1.env.jwt.expiresIn,
        });
    }
    async register(input) {
        const email = input.email.trim().toLowerCase();
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            throw new errorHandler_1.AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, env_1.env.bcryptSaltRounds);
        const user = await models_1.User.create({
            name: input.name.trim(),
            email,
            password_hash: passwordHash,
            role: 'student',
            classification: input.classification ?? null,
            last_activity_at: new Date(),
        });
        const token = this.signToken(user);
        return {
            user: user.toSafeJSON(),
            token,
        };
    }
    async login(input) {
        const email = input.email.trim().toLowerCase();
        const user = await models_1.User.findOne({ where: { email } });
        if (!user) {
            throw new errorHandler_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const passwordMatches = await bcryptjs_1.default.compare(input.password, user.password_hash);
        if (!passwordMatches) {
            throw new errorHandler_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        await user.update({ last_activity_at: new Date() });
        const token = this.signToken(user);
        return {
            user: user.toSafeJSON(),
            token,
        };
    }
    async getProfile(userId) {
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        return user.toSafeJSON();
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map