"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = exports.WebhookController = void 0;
const zod_1 = require("zod");
const errorHandler_1 = require("../../middlewares/errorHandler");
const validation_1 = require("../../utils/validation");
const webhook_service_1 = require("./webhook.service");
const listEventsQuerySchema = zod_1.z.object({
    page: zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce.number().int().min(1).default(1)),
    limit: zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce.number().int().min(1).max(100).default(20)),
    status: zod_1.z.enum(['received', 'processed', 'failed']).optional(),
    provider: zod_1.z.string().trim().max(100).optional(),
});
function readQueryParam(query, dottedKey, nestedKey) {
    const flat = query[dottedKey];
    if (typeof flat === 'string') {
        return flat;
    }
    const nestedObj = query.hub;
    if (typeof nestedObj === 'object' && nestedObj !== null && !Array.isArray(nestedObj)) {
        const nested = nestedObj[nestedKey];
        if (typeof nested === 'string') {
            return nested;
        }
    }
    return undefined;
}
class WebhookController {
    service;
    constructor(service = webhook_service_1.webhookService) {
        this.service = service;
    }
    verifyWhatsApp = (req, res, next) => {
        try {
            const challenge = this.service.verifyWhatsAppChallenge({
                mode: readQueryParam(req.query, 'hub.mode', 'mode'),
                verifyToken: readQueryParam(req.query, 'hub.verify_token', 'verify_token'),
                challenge: readQueryParam(req.query, 'hub.challenge', 'challenge'),
            });
            res.status(200).type('text/plain').send(challenge);
        }
        catch (error) {
            next(error);
        }
    };
    receiveWhatsApp = async (req, res, next) => {
        try {
            if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
                throw new errorHandler_1.AppError('Webhook payload must be a JSON object', 400, 'VALIDATION_ERROR');
            }
            const result = await this.service.processWhatsAppEvent(req.body);
            res.status(200).json({
                success: true,
                duplicate: result.duplicate,
                message: result.message,
                data: result.event,
                ...(result.alert ? { alert: result.alert } : {}),
            });
        }
        catch (error) {
            next(error);
        }
    };
    listEvents = async (req, res, next) => {
        try {
            const parsed = (0, validation_1.parseWithSchema)(listEventsQuerySchema, req.query);
            const result = await this.service.listEvents(parsed);
            res.status(200).json({
                success: true,
                data: result.data,
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.WebhookController = WebhookController;
exports.webhookController = new WebhookController();
//# sourceMappingURL=webhook.controller.js.map