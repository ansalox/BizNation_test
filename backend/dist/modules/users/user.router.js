"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const user_controller_1 = require("./user.controller");
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.email().max(180),
    password: zod_1.z.string().min(6).max(100),
    role: zod_1.z.enum(['admin', 'student']).optional(),
    classification: zod_1.z.string().trim().max(100).nullable().optional(),
});
const updateUserSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).max(120).optional(),
    email: zod_1.z.email().max(180).optional(),
    password: zod_1.z.string().min(6).max(100).optional(),
    role: zod_1.z.enum(['admin', 'student']).optional(),
    classification: zod_1.z.string().trim().max(100).nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.use(auth_middleware_1.authenticateJWT);
/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List all active users (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.usersRouter.get('/', (0, auth_middleware_1.requireRole)('admin'), user_controller_1.userController.list);
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID (Admin or self)
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
 *         description: User details.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 */
exports.usersRouter.get('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), user_controller_1.userController.getById);
/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *     responses:
 *       201:
 *         description: User created.
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.usersRouter.post('/', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateBody)(createUserSchema), user_controller_1.userController.create);
/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user (Admin or self)
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
 *         description: Updated user.
 *   patch:
 *     tags:
 *       - Users
 *     summary: Partially update a user (Admin or self)
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
 *         description: Updated user.
 */
exports.usersRouter.put('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateUserSchema), user_controller_1.userController.update);
exports.usersRouter.patch('/:id', (0, auth_middleware_1.requireRole)('admin', 'student'), (0, validate_1.validateUuidParam)('id'), (0, validate_1.validateBody)(updateUserSchema), user_controller_1.userController.update);
/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Soft-delete a user (Admin only)
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
 *         description: User soft-deleted (`deleted_at` populated).
 *       403:
 *         description: Forbidden (requires admin role).
 */
exports.usersRouter.delete('/:id', (0, auth_middleware_1.requireRole)('admin'), (0, validate_1.validateUuidParam)('id'), user_controller_1.userController.remove);
//# sourceMappingURL=user.router.js.map