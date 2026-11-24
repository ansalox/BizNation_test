import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate';
import { authController } from './auth.controller';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.email('Must be a valid email address').max(180),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  classification: z.string().trim().max(100).nullable().optional(),
});

const loginSchema = z.object({
  email: z.email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authRouter: Router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new student account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *     responses:
 *       201:
 *         description: Student account created and JWT returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error.
 *       409:
 *         description: Email already registered.
 */
authRouter.post('/register', validateBody(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate user and issue JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginInput'
 *     responses:
 *       200:
 *         description: Authentication succeeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid email or password.
 */
authRouter.post('/login', validateBody(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user.
 *       401:
 *         description: Missing or invalid Bearer token.
 */
authRouter.get('/me', authenticateJWT, authController.me);
