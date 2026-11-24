import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../../middlewares/auth.middleware';
import { validateBody, validateUuidParam } from '../../middlewares/validate';
import { progressController } from './progress.controller';

const recordProgressSchema = z.object({
  user_id: z.uuid('user_id must be a valid UUID').optional(),
  course_id: z.uuid('course_id must be a valid UUID'),
  lesson_id: z.uuid('lesson_id must be a valid UUID'),
  completed: z.boolean().optional(),
});

const updateProgressSchema = z.object({
  completed: z.boolean(),
});

export const progressRouter: Router = Router();

progressRouter.use(authenticateJWT);

/**
 * @openapi
 * /api/progress:
 *   get:
 *     tags:
 *       - Progress
 *     summary: List lesson progress records (Admin sees all; students see own)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of lesson progress records.
 */
progressRouter.get('/', requireRole('admin', 'student'), progressController.list);

/**
 * @openapi
 * /api/progress/{id}:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get progress record by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress record details.
 *       404:
 *         description: Progress record not found.
 */
progressRouter.get('/:id', requireRole('admin', 'student'), validateUuidParam('id'), progressController.getById);

/**
 * @openapi
 * /api/progress:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Record or update lesson completion progress
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LessonProgressInput'
 *     responses:
 *       201:
 *         description: Progress created.
 *       200:
 *         description: Progress updated.
 */
progressRouter.post('/', requireRole('admin', 'student'), validateBody(recordProgressSchema), progressController.record);

/**
 * @openapi
 * /api/progress/{id}:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Update progress completion state
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress updated.
 *   patch:
 *     tags:
 *       - Progress
 *     summary: Partially update progress completion state
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress updated.
 */
progressRouter.put(
  '/:id',
  requireRole('admin', 'student'),
  validateUuidParam('id'),
  validateBody(updateProgressSchema),
  progressController.update,
);
progressRouter.patch(
  '/:id',
  requireRole('admin', 'student'),
  validateUuidParam('id'),
  validateBody(updateProgressSchema),
  progressController.update,
);

/**
 * @openapi
 * /api/progress/{id}:
 *   delete:
 *     tags:
 *       - Progress
 *     summary: Soft-delete a progress record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress record soft-deleted.
 */
progressRouter.delete('/:id', requireRole('admin', 'student'), validateUuidParam('id'), progressController.remove);
