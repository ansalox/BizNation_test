"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const progress_controller_1 = require("./progress.controller");
const recordProgressSchema = zod_1.z.object({
    user_id: zod_1.z.uuid('user_id must be a valid UUID').optional(),
    course_id: zod_1.z.uuid('course_id must be a valid UUID'),
    lesson_id: zod_1.z.uuid('lesson_id must be a valid UUID'),
    completed: zod_1.z.boolean().optional(),
});
const updateProgressSchema = zod_1.z.object({
    completed: zod_1.z.boolean(),
});
exports.progressRouter = (0, express_1.Router)();
exports.progressRouter.use(auth_middleware_1.authenticateJWT);
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
exports.progressRouter.get('/', (0, auth_middleware_1.requireRole)('admin', 'student'), progress_controller_1.progressController.list);
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
exports.progressRouter.get('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), progress_controller_1.progressController.getById);
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
exports.progressRouter.post('/', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateBody)(recordProgressSchema), progress_controller_1.progressController.record);
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
exports.progressRouter.put('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateProgressSchema), progress_controller_1.progressController.update);
exports.progressRouter.patch('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateProgressSchema), progress_controller_1.progressController.update);
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
exports.progressRouter.delete('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), progress_controller_1.progressController.remove);
//# sourceMappingURL=progress.router.js.map