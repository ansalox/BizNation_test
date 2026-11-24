"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
require("./database/models");
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFound_1 = require("./middlewares/notFound");
const auth_router_1 = require("./modules/auth/auth.router");
const automation_router_1 = require("./modules/automation/automation.router");
const course_router_1 = require("./modules/courses/course.router");
const health_router_1 = require("./modules/health/health.router");
const lesson_router_1 = require("./modules/lessons/lesson.router");
const progress_router_1 = require("./modules/progress/progress.router");
const user_router_1 = require("./modules/users/user.router");
const webhook_router_1 = require("./modules/webhooks/webhook.router");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.env.corsOrigin,
        credentials: true,
    }));
    app.use(express_1.default.json({
        limit: '1mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // OpenAPI / Swagger documentation at /api/docs (and /api/docs.json)
    app.get('/api/docs.json', (_req, res) => {
        res.status(200).json(swagger_1.swaggerSpec);
    });
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    // Keep /api-docs alias pointing to the same spec for backwards compatibility
    app.get('/api-docs.json', (_req, res) => {
        res.status(200).json(swagger_1.swaggerSpec);
    });
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    // Health endpoints (root level for AWS ALB / ECS target group checks)
    app.use('/health', health_router_1.healthRouter);
    // Versioned / prefixed REST API modules (Router -> Controller -> Service -> Model)
    const apiRouter = (0, express_1.Router)();
    apiRouter.get('/', (_req, res) => {
        res.status(200).json({
            success: true,
            data: {
                name: 'Biz Nation API',
                version: '1.0.0',
                docs: '/api/docs',
                health: '/health',
            },
        });
    });
    apiRouter.use('/auth', auth_router_1.authRouter);
    apiRouter.use('/users', user_router_1.usersRouter);
    apiRouter.use('/courses', course_router_1.coursesRouter);
    apiRouter.use('/lessons', lesson_router_1.lessonsRouter);
    apiRouter.use('/progress', progress_router_1.progressRouter);
    apiRouter.use('/webhooks', webhook_router_1.webhooksRouter);
    apiRouter.use('/automation', automation_router_1.automationRouter);
    app.use(env_1.env.apiPrefix, apiRouter);
    app.use(notFound_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.app = createApp();
//# sourceMappingURL=app.js.map