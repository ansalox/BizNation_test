import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../../middlewares/auth.middleware';
import { validateBody, validateUuidParam } from '../../middlewares/validate';
import { userController } from './user.controller';

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(180),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'student']).optional(),
  classification: z.string().trim().max(100).nullable().optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.email().max(180).optional(),
    password: z.string().min(6).max(100).optional(),
    role: z.enum(['admin', 'student']).optional(),
    classification: z.string().trim().max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const usersRouter: Router = Router();

usersRouter.use(authenticateJWT);

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
usersRouter.get('/', requireRole('admin'), userController.list);

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
usersRouter.get('/:id', requireRole('admin', 'student'), validateUuidParam('id'), userController.getById);

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
usersRouter.post('/', requireRole('admin'), validateBody(createUserSchema), userController.create);

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
usersRouter.put(
  '/:id',
  requireRole('admin', 'student'),
  validateUuidParam('id'),
  validateBody(updateUserSchema),
  userController.update,
);
usersRouter.patch(
  '/:id',
  requireRole('admin', 'student'),
  validateUuidParam('id'),
  validateBody(updateUserSchema),
  userController.update,
);

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
usersRouter.delete('/:id', requireRole('admin'), validateUuidParam('id'), userController.remove);
