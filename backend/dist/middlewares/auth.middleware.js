"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
function isValidRole(value) {
    return value === 'admin' || value === 'student';
}
function authenticateJWT(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(new errorHandler_1.AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
        return;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        next(new errorHandler_1.AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret);
        if (typeof decoded !== 'object' ||
            decoded === null ||
            typeof decoded.sub !== 'string' ||
            typeof decoded.email !== 'string' ||
            !isValidRole(decoded.role)) {
            next(new errorHandler_1.AppError('Invalid authentication token payload', 401, 'INVALID_TOKEN'));
            return;
        }
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch {
        next(new errorHandler_1.AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
    }
}
function requireRole(...allowedRoles) {
    const normalizedRoles = allowedRoles.flat();
    return (req, _res, next) => {
        if (!req.user) {
            next(new errorHandler_1.AppError('Authentication is required', 401, 'UNAUTHORIZED'));
            return;
        }
        if (!normalizedRoles.includes(req.user.role)) {
            next(new errorHandler_1.AppError('Insufficient permissions to access this resource', 403, 'FORBIDDEN'));
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map