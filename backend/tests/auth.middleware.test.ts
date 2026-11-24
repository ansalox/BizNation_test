import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { authenticateJWT, requireRole } from '../src/middlewares/auth.middleware';
import { AppError } from '../src/middlewares/errorHandler';

const createSignedToken = (payload: { sub: string; email: string; role: 'admin' | 'student' }) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: '1h' });

describe('Security Middlewares: authenticateJWT & requireRole', () => {
  describe('authenticateJWT (Unit)', () => {
    it('passes 401 AppError to next() when Authorization header is missing', () => {
      const req = { headers: {} } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(req.user).toBeUndefined();
    });

    it('passes 401 AppError to next() when Authorization scheme is not Bearer', () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateJWT(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('passes 401 AppError to next() when JWT token is invalid or signed with wrong secret', () => {
      const invalidToken = jwt.sign(
        { sub: '10000000-0000-4000-8000-000000000001', email: 'a@b.com', role: 'student' },
        'wrong-secret',
      );
      const req = { headers: { authorization: `Bearer ${invalidToken}` } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateJWT(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('INVALID_TOKEN');
    });

    it('attaches req.user and calls next() without error when JWT is valid', () => {
      const userId = '10000000-0000-4000-8000-000000000001';
      const token = createSignedToken({
        sub: userId,
        email: 'admin@biznation.com',
        role: 'admin',
      });
      const req = { headers: { authorization: `Bearer ${token}` } } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: userId,
        email: 'admin@biznation.com',
        role: 'admin',
      });
    });
  });

  describe('requireRole (Unit)', () => {
    it('passes 401 AppError when req.user is missing', () => {
      const middleware = requireRole('admin');
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      middleware(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
    });

    it('passes 403 Forbidden AppError when student accesses admin-only route', () => {
      const middleware = requireRole('admin');
      const req = {
        user: {
          id: '10000000-0000-4000-8000-000000000002',
          email: 'student@biznation.com',
          role: 'student',
        },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      middleware(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('passes 403 Forbidden AppError when admin accesses student-only route', () => {
      const middleware = requireRole('student');
      const req = {
        user: {
          id: '10000000-0000-4000-8000-000000000001',
          email: 'admin@biznation.com',
          role: 'admin',
        },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      middleware(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('allows access when user role matches allowed roles', () => {
      const middleware = requireRole('admin', 'student');
      const req = {
        user: {
          id: '10000000-0000-4000-8000-000000000002',
          email: 'student@biznation.com',
          role: 'student',
        },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Protected Routes HTTP Enforcement (Supertest)', () => {
    it('returns 401 when accessing protected endpoints without a token', async () => {
      const responses = await Promise.all([
        request(app).get('/api/auth/me'),
        request(app).get('/api/users'),
        request(app).get('/api/courses'),
        request(app).get('/api/lessons'),
        request(app).get('/api/progress'),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns 403 Forbidden when student requests admin-only routes', async () => {
      const studentToken = createSignedToken({
        sub: '10000000-0000-4000-8000-000000000002',
        email: 'laura.gomez@biznation.com',
        role: 'student',
      });

      const responses = await Promise.all([
        request(app).get('/api/users').set('Authorization', `Bearer ${studentToken}`),
        request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ title: 'Unauthorized Course' }),
        request(app)
          .post('/api/lessons')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            course_id: '20000000-0000-4000-8000-000000000001',
            title: 'Unauthorized Lesson',
          }),
        request(app)
          .delete('/api/users/10000000-0000-4000-8000-000000000003')
          .set('Authorization', `Bearer ${studentToken}`),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FORBIDDEN');
      }
    });
  });
});
