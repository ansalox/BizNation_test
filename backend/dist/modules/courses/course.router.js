"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const course_controller_1 = require("./course.controller");
const createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200),
    description: zod_1.z.string().trim().optional(),
    is_published: zod_1.z.boolean().optional(),
});
const updateCourseSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(2).max(200).optional(),
    description: zod_1.z.string().trim().optional(),
    is_published: zod_1.z.boolean().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
exports.coursesRouter = (0, express_1.Router)();
exports.coursesRouter.use(auth_middleware_1.authenticateJWT);
/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags:
 *       - Courses
 *     summary: List courses with pagination, filters, and role-based visibility/metrics
 *     description: >
 *       Students see only published courses (`is_published: true`) along with their own `progressPercentage`.
 *       Admins see all courses (including drafts) along with aggregated `metrics` (`totalStudentsWithProgress`, `averageProgressPercentage`).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Partial case-insensitive search on course title (ILIKE)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter courses created on or after this date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter courses created on or before this date (ISO 8601)
 *       - in: query
 *         name: minProgress
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum progress percentage (student progress or admin average progress)
 *       - in: query
 *         name: maxProgress
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum progress percentage (student progress or admin average progress)
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by publication status (effective for admin users)
 *     responses:
 *       200:
 *         description: Paginated list of courses enriched by user role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCoursesResponse'
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 */
exports.coursesRouter.get('/', (0, auth_middleware_1.requireRole)('admin', 'student'), course_controller_1.courseController.list);
/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course by ID with lessons and role-specific progress/metrics
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
 *         description: Course details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/CourseWithRoleMetrics' }
 *       404:
 *         description: Course not found.
 */
exports.coursesRouter.get('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), course_controller_1.courseController.getById);
/**
 * @openapi
 * /api/courses:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create a course (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: Course created.
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.coursesRouter.post('/', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateBody)(createCourseSchema), course_controller_1.courseController.create);
/**
 * @openapi
 * /api/courses/{id}:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update a course (Admin only)
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
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       200:
 *         description: Course updated.
 *   patch:
 *     tags:
 *       - Courses
 *     summary: Partially update a course (Admin only)
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
 *         description: Course updated.
 */
exports.coursesRouter.put('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateCourseSchema), course_controller_1.courseController.update);
exports.coursesRouter.patch('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateCourseSchema), course_controller_1.courseController.update);
/**
 * @openapi
 * /api/courses/{id}:
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Soft-delete a course (Admin only, blocked with 409 if progress exists)
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
 *         description: Course soft-deleted.
 *       403:
 *         description: Forbidden (requires admin role).
 *       404:
 *         description: Course not found.
 *       409:
 *         description: Conflict — course cannot be deleted because students have recorded progress.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.coursesRouter.delete('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), course_controller_1.courseController.remove);
//# sourceMappingURL=course.router.js.map