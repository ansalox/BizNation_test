"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const sequelize_1 = require("sequelize");
const env_1 = require("../../config/env");
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
const automation_service_1 = require("../automation/automation.service");
function asNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
class WebhookService {
    verifyWhatsAppChallenge(input) {
        if (!input.challenge) {
            throw new errorHandler_1.AppError('Missing hub.challenge parameter', 400, 'VALIDATION_ERROR');
        }
        if (input.mode !== undefined && input.mode !== 'subscribe') {
            throw new errorHandler_1.AppError('Invalid hub.mode parameter', 403, 'WEBHOOK_VERIFICATION_FAILED');
        }
        if (!env_1.env.webhook.verifyToken || input.verifyToken !== env_1.env.webhook.verifyToken) {
            throw new errorHandler_1.AppError('Invalid hub.verify_token', 403, 'WEBHOOK_VERIFICATION_FAILED');
        }
        return input.challenge;
    }
    extractEventMetadata(payload) {
        const entries = Array.isArray(payload.entry) ? payload.entry : [];
        const firstEntry = entries[0];
        const firstChange = Array.isArray(firstEntry?.changes) ? firstEntry.changes[0] : undefined;
        const externalEventId = asNonEmptyString(payload.external_event_id) ??
            asNonEmptyString(payload.event_id) ??
            asNonEmptyString(payload.id) ??
            asNonEmptyString(firstChange?.value?.messages?.[0]?.id) ??
            asNonEmptyString(firstChange?.value?.statuses?.[0]?.id) ??
            asNonEmptyString(firstEntry?.id);
        if (!externalEventId) {
            throw new errorHandler_1.AppError('Missing external_event_id in webhook payload', 400, 'VALIDATION_ERROR');
        }
        const eventType = asNonEmptyString(payload.event_type) ??
            asNonEmptyString(payload.type) ??
            asNonEmptyString(firstChange?.field) ??
            asNonEmptyString(payload.object) ??
            'whatsapp.event';
        const provider = asNonEmptyString(payload.provider) ?? 'whatsapp_meta';
        return {
            externalEventId,
            eventType,
            provider,
        };
    }
    async processWhatsAppEvent(rawPayload) {
        const { externalEventId, eventType, provider } = this.extractEventMetadata(rawPayload);
        const existing = await models_1.WebhookEvent.findOne({
            where: { external_event_id: externalEventId },
        });
        if (existing) {
            return {
                duplicate: true,
                message: 'Event already processed',
                event: existing,
            };
        }
        let event;
        try {
            event = await models_1.WebhookEvent.create({
                external_event_id: externalEventId,
                provider,
                event_type: eventType,
                payload: rawPayload,
                status: 'received',
                attempts: 1,
                error_log: null,
            });
        }
        catch (error) {
            if (error instanceof sequelize_1.UniqueConstraintError) {
                const concurrentExisting = await models_1.WebhookEvent.findOne({
                    where: { external_event_id: externalEventId },
                });
                if (concurrentExisting) {
                    return {
                        duplicate: true,
                        message: 'Event already processed',
                        event: concurrentExisting,
                    };
                }
            }
            throw error;
        }
        try {
            if (rawPayload.simulate_error === true) {
                throw new Error(asNonEmptyString(rawPayload.error_message) ??
                    'Simulated webhook processing error');
            }
            await event.update({ status: 'processed' });
            const alert = await automation_service_1.automationService.analyzeAndRecordWebhookAlert(event, rawPayload);
            return {
                duplicate: false,
                message: 'Webhook event processed successfully',
                event,
                alert,
            };
        }
        catch (processingError) {
            const errorMessage = processingError instanceof Error
                ? processingError.message
                : 'Unknown webhook processing error';
            await event.update({
                status: 'failed',
                error_log: errorMessage,
            });
            return {
                duplicate: false,
                message: 'Webhook event recorded with processing failure',
                event,
            };
        }
    }
    async listEvents(query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.provider) {
            where.provider = query.provider;
        }
        const { rows, count } = await models_1.WebhookEvent.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });
        const total = typeof count === 'number' ? count : 0;
        return {
            data: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map