import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../../middlewares/auth.middleware';
import { validateBody, validateUuidParam } from '../../middlewares/validate';
import { automationController } from './automation.controller';

const updateAlertStatusSchema = z.object({
  status: z.enum(['open', 'reviewed', 'resolved']),
});

export const automationRouter: Router = Router();

automationRouter.use(authenticateJWT, requireRole('admin'));

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
automationRouter.get('/students-report', automationController.getStudentsReport);

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
automationRouter.get('/alerts', automationController.listAlerts);

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
automationRouter.patch(
  '/alerts/:id',
  validateUuidParam('id'),
  validateBody(updateAlertStatusSchema),
  automationController.updateAlertStatus,
);
