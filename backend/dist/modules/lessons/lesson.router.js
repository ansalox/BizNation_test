"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const lesson_controller_1 = require("./lesson.controller");
const createLessonSchema = zod_1.z.object({
    course_id: zod_1.z.uuid('course_id must be a valid UUID'),
    title: zod_1.z.string().trim().min(2).max(200),
    content: zod_1.z.string().trim().optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const updateLessonSchema = zod_1.z
    .object({
    course_id: zod_1.z.uuid('course_id must be a valid UUID').optional(),
    title: zod_1.z.string().trim().min(2).max(200).optional(),
    content: zod_1.z.string().trim().optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
exports.lessonsRouter = (0, express_1.Router)();
exports.lessonsRouter.use(auth_middleware_1.authenticateJWT);
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
exports.lessonsRouter.get('/', (0, auth_middleware_1.requireRole)('admin', 'student'), lesson_controller_1.lessonController.list);
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
exports.lessonsRouter.get('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), lesson_controller_1.lessonController.getById);
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
exports.lessonsRouter.post('/', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateBody)(createLessonSchema), lesson_controller_1.lessonController.create);
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
exports.lessonsRouter.put('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateLessonSchema), lesson_controller_1.lessonController.update);
exports.lessonsRouter.patch('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateLessonSchema), lesson_controller_1.lessonController.update);
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
exports.lessonsRouter.delete('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), lesson_controller_1.lessonController.remove);
//# sourceMappingURL=lesson.router.js.map