import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../middlewares/auth.middleware';
import { verifyWebhookSignature } from '../../middlewares/webhookSignature.middleware';
import { webhookController } from './webhook.controller';

export const webhooksRouter: Router = Router();

/**
 * @openapi
 * /api/webhooks/whatsapp:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: WhatsApp / Meta webhook challenge verification
 *     description: Validates `hub.verify_token` against `WEBHOOK_VERIFY_TOKEN` and echoes `hub.challenge`.
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *           example: subscribe
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge verified; returns raw `hub.challenge` plain text.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Missing challenge parameter.
 *       403:
 *         description: Invalid verification token or mode.
 */
webhooksRouter.get('/whatsapp', webhookController.verifyWhatsApp);

/**
 * @openapi
 * /api/webhooks/whatsapp:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Receive WhatsApp / Meta webhook events (HMAC-SHA256 & idempotent)
 *     description: >
 *       Verifies HMAC-SHA256 signature in `x-hub-signature-256` using `WEBHOOK_SECRET`.
 *       Ensures idempotency via unique `external_event_id`: duplicate deliveries return `200 OK` without duplicating rows.
 *     parameters:
 *       - in: header
 *         name: x-hub-signature-256
 *         required: true
 *         schema:
 *           type: string
 *           example: sha256=abcdef123456...
 *         description: HMAC-SHA256 digest of the raw JSON body (`sha256=<hex>`)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WhatsAppWebhookInput'
 *     responses:
 *       200:
 *         description: Event processed or already processed (idempotent).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookProcessResponse'
 *       400:
 *         description: Invalid payload or missing external_event_id.
 *       401:
 *         description: Missing or invalid `x-hub-signature-256` HMAC signature.
 */
webhooksRouter.post('/whatsapp', verifyWebhookSignature, webhookController.receiveWhatsApp);

/**
 * @openapi
 * /api/webhooks/events:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: List recorded webhook events (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [received, processed, failed]
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           example: whatsapp_meta
 *     responses:
 *       200:
 *         description: Paginated list of recorded webhook events.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedWebhookEventsResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (requires admin role).
 */
webhooksRouter.get(
  '/events',
  authenticateJWT,
  requireRole('admin'),
  webhookController.listEvents,
);
