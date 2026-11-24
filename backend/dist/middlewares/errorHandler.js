"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const sequelize_1 = require("sequelize");
const env_1 = require("../config/env");
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
function sendErrorResponse(res, statusCode, code, message, details) {
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(details !== undefined ? { details } : {}),
        },
    });
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        sendErrorResponse(res, err.statusCode, err.code, err.message, err.details);
        return;
    }
    if (err instanceof sequelize_1.UniqueConstraintError) {
        const fields = err.errors.map((e) => ({ field: e.path, message: e.message }));
        sendErrorResponse(res, 409, 'CONFLICT', 'Resource already exists', fields);
        return;
    }
    if (err instanceof sequelize_1.ValidationError) {
        const issues = err.errors.map((e) => ({ field: e.path, message: e.message }));
        sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Database validation failed', issues);
        return;
    }
    if (err instanceof sequelize_1.ForeignKeyConstraintError) {
        sendErrorResponse(res, 400, 'FOREIGN_KEY_ERROR', 'Referenced resource does not exist');
        return;
    }
    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
        sendErrorResponse(res, 400, 'INVALID_JSON', 'Malformed JSON request body');
        return;
    }
    const isDev = env_1.env.nodeEnv === 'development';
    if (env_1.env.nodeEnv !== 'test') {
        console.error('[UnhandledError]', err);
    }
    sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR', isDev ? err.message : 'An unexpected internal error occurred', isDev ? { stack: err.stack } : undefined);
}
//# sourceMappingURL=errorHandler.js.map