import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../../middlewares/auth.middleware';
import { validateBody, validateUuidParam } from '../../middlewares/validate';
import { lessonController } from './lesson.controller';

const createLessonSchema = z.object({
  course_id: z.uuid('course_id must be a valid UUID'),
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().optional(),
  order_index: z.number().int().min(0).optional(),
});

const updateLessonSchema = z
  .object({
    course_id: z.uuid('course_id must be a valid UUID').optional(),
    title: z.string().trim().min(2).max(200).optional(),
    content: z.string().trim().optional(),
    order_index: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const lessonsRouter: Router = Router();

lessonsRouter.use(authenticateJWT);

/**
 * @openapi
 * /api/lessons:
 *   get:
 *     tags:
 *       - Lessons
 *     summary: List lessons (optionally filtered by courseId)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of lessons.
 */
lessonsRouter.get('/', requireRole('admin', 'student'), lessonController.list);

/**
 * @openapi
 * /api/lessons/{id}:
 *   get:
 *     tags:
 *       - Lessons
 *     summary: Get lesson by ID
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
 *         description: Lesson details.
 *       404:
 *         description: Lesson not found.
 */
lessonsRouter.get('/:id', requireRole('admin', 'student'), validateUuidParam('id'), lessonController.getById);

/**
 * @openapi
 * /api/lessons:
 *   post:
 *     tags:
 *       - Lessons
 *     summary: Create a lesson (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LessonInput'
 *     responses:
 *       201:
 *         description: Lesson created.
 *       403:
 *         description: Forbidden (requires admin role).
 */
lessonsRouter.post('/', requireRole('admin'), validateBody(createLessonSchema), lessonController.create);

/**
 * @openapi
 * /api/lessons/{id}:
 *   put:
 *     tags:
 *       - Lessons
 *     summary: Update a lesson (Admin only)
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
 *             $ref: '#/components/schemas/LessonInput'
 *     responses:
 *       200:
 *         description: Lesson updated.
 *   patch:
 *     tags:
 *       - Lessons
 *     summary: Partially update a lesson (Admin only)
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
 *         description: Lesson updated.
 */
lessonsRouter.put(
  '/:id',
  requireRole('admin'),
  validateUuidParam('id'),
  validateBody(updateLessonSchema),
  lessonController.update,
);
lessonsRouter.patch(
  '/:id',
  requireRole('admin'),
  validateUuidParam('id'),
  validateBody(updateLessonSchema),
  lessonController.update,
);

/**
 * @openapi
 * /api/lessons/{id}:
 *   delete:
 *     tags:
 *       - Lessons
 *     summary: Soft-delete a lesson (Admin only)
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
 *         description: Lesson soft-deleted.
 */
lessonsRouter.delete('/:id', requireRole('admin'), validateUuidParam('id'), lessonController.remove);
