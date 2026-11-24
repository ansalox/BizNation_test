"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_1 = require("../../middlewares/validate");
const auth_controller_1 = require("./auth.controller");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    email: zod_1.z.email('Must be a valid email address').max(180),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(100),
    classification: zod_1.z.string().trim().max(100).nullable().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.email('Must be a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.authRouter = (0, express_1.Router)();
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
exports.authRouter.post('/register', (0, validate_1.validateBody)(registerSchema), auth_controller_1.authController.register);
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
exports.authRouter.post('/login', (0, validate_1.validateBody)(loginSchema), auth_controller_1.authController.login);
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
exports.authRouter.get('/me', auth_middleware_1.authenticateJWT, auth_controller_1.authController.me);
//# sourceMappingURL=auth.router.js.map