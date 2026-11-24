import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { User } from '../src/database/models';

function buildMockUser(overrides: Partial<{
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'student';
  classification: string | null;
  last_activity_at: Date | null;
}> = {}) {
  const now = new Date();
  const data = {
    id: '10000000-0000-4000-8000-000000000010',
    name: 'Test Student',
    email: 'student@biznation.com',
    password_hash: bcrypt.hashSync('Secret123!', 4),
    role: 'student' as const,
    classification: 'beginner',
    last_activity_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  };

  return {
    ...data,
    toSafeJSON: vi.fn().mockImplementation(() => {
      const { password_hash: _ignored, ...safe } = data;
      return safe;
    }),
    update: vi.fn().mockImplementation(async (updates: Record<string, unknown>) => {
      Object.assign(data, updates);
      return data;
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  } as unknown as User;
}

describe('Auth Endpoints (/api/auth/*)', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new student, hashes password with bcrypt, and returns JWT', async () => {
      const mockCreatedUser = buildMockUser({
        email: 'nuevo@biznation.com',
        name: 'Nuevo Usuario',
      });

      vi.spyOn(User, 'findOne').mockResolvedValueOnce(null);
      const createSpy = vi.spyOn(User, 'create').mockResolvedValueOnce(mockCreatedUser);

      const response = await request(app).post('/api/auth/register').send({
        name: 'Nuevo Usuario',
        email: 'Nuevo@BizNation.com',
        password: 'Password123!',
        classification: 'beginner',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeTypeOf('string');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
      expect(response.body.data.user.role).toBe('student');

      const createPayload = createSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(createPayload.email).toBe('nuevo@biznation.com');
      expect(createPayload.role).toBe('student');
      expect(typeof createPayload.password_hash).toBe('string');
      expect(bcrypt.compareSync('Password123!', String(createPayload.password_hash))).toBe(true);
    });

    it('returns 409 Conflict when email already exists', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValueOnce(buildMockUser());

      const response = await request(app).post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'student@biznation.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns 400 Validation Error when input is invalid', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials and returns JWT token', async () => {
      const mockUser = buildMockUser({
        id: '10000000-0000-4000-8000-000000000001',
        email: 'admin@biznation.com',
        role: 'admin',
        password_hash: bcrypt.hashSync('Admin123!', 4),
      });

      vi.spyOn(User, 'findOne').mockResolvedValueOnce(mockUser);

      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@biznation.com',
        password: 'Admin123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
      expect(mockUser.update).toHaveBeenCalledWith({
        last_activity_at: expect.any(Date),
      });

      const decoded = jwt.verify(response.body.data.token, env.jwt.secret) as jwt.JwtPayload;
      expect(decoded.sub).toBe('10000000-0000-4000-8000-000000000001');
      expect(decoded.role).toBe('admin');
    });

    it('returns 401 on wrong password', async () => {
      const mockUser = buildMockUser({
        password_hash: bcrypt.hashSync('CorrectPass123!', 4),
      });
      vi.spyOn(User, 'findOne').mockResolvedValueOnce(mockUser);

      const response = await request(app).post('/api/auth/login').send({
        email: 'student@biznation.com',
        password: 'WrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current authenticated user profile', async () => {
      const userId = '10000000-0000-4000-8000-000000000002';
      const mockUser = buildMockUser({ id: userId });
      vi.spyOn(User, 'findByPk').mockResolvedValueOnce(mockUser);

      const token = jwt.sign(
        { sub: userId, email: 'student@biznation.com', role: 'student' },
        env.jwt.secret,
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });
  });
});
