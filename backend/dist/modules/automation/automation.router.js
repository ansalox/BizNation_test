"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const automation_controller_1 = require("./automation.controller");
const updateAlertStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'reviewed', 'resolved']),
});
exports.automationRouter = (0, express_1.Router)();
exports.automationRouter.use(auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)('admin'));
/**
 * @openapi
 * /api/automation/students-report:
 *   get:
 *     tags:
 *       - Automation
 *     summary: Get student progress scoring (0-100) and classification report (Admin only)
 *     description: >
 *       Combines lesson completion percentage and `last_activity_at` recency to score students
 *       and classify them into `Alto desempeño`, `En progreso`, `En riesgo`, or `Inactivo`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student scoring report and aggregated breakdown.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentsReportResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.automationRouter.get('/students-report', automation_controller_1.automationController.getStudentsReport);
/**
 * @openapi
 * /api/automation/alerts:
 *   get:
 *     tags:
 *       - Automation
 *     summary: List AI-analyzed WhatsApp support alerts and sentiment tags (Admin only)
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [positive, neutral, negative]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, reviewed, resolved]
 *     responses:
 *       200:
 *         description: Paginated list of support alerts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSupportAlertsResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.automationRouter.get('/alerts', automation_controller_1.automationController.listAlerts);
/**
 * @openapi
 * /api/automation/alerts/{id}:
 *   patch:
 *     tags:
 *       - Automation
 *     summary: Update support alert review status (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, reviewed, resolved]
 *     responses:
 *       200:
 *         description: Updated support alert.
 *       404:
 *         description: Alert not found.
 */
exports.automationRouter.patch('/alerts/:id', (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateAlertStatusSchema), automation_controller_1.automationController.updateAlertStatus);
//# sourceMappingURL=automation.router.js.map