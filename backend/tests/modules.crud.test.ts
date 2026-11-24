import jwt from 'jsonwebtoken';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { Course, Lesson, LessonProgress, User } from '../src/database/models';
import { errorHandler } from '../src/middlewares/errorHandler';
import { automationService } from '../src/modules/automation/automation.service';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_ID = '10000000-0000-4000-8000-000000000001';
const STUDENT_ID = '10000000-0000-4000-8000-000000000002';
const OTHER_STUDENT_ID = '10000000-0000-4000-8000-000000000003';
const COURSE_ID = '20000000-0000-4000-8000-000000000001';
const LESSON_ID = '30000000-0000-4000-8000-000000000001';
const PROGRESS_ID = '40000000-0000-4000-8000-000000000001';

const adminToken = jwt.sign(
  { sub: ADMIN_ID, email: 'admin@biznation.com', role: 'admin' },
  env.jwt.secret,
);
const studentToken = jwt.sign(
  { sub: STUDENT_ID, email: 'laura@biznation.com', role: 'student' },
  env.jwt.secret,
);

describe('REST CRUD Modules (Router -> Controller -> Service -> Model)', () => {
  describe('Users CRUD (/api/users)', () => {
    it('allows admin to list and soft-delete users', async () => {
      const mockUser = {
        id: STUDENT_ID,
        name: 'Laura',
        email: 'laura@biznation.com',
        role: 'student',
        toSafeJSON: () => ({
          id: STUDENT_ID,
          name: 'Laura',
          email: 'laura@biznation.com',
          role: 'student',
        }),
        destroy: vi.fn().mockResolvedValue(undefined),
      } as unknown as User;

      vi.spyOn(User, 'findAll').mockResolvedValueOnce([mockUser]);
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);

      vi.spyOn(User, 'findByPk').mockResolvedValueOnce(mockUser);
      const delRes = await request(app)
        .delete(`/api/users/${STUDENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data).toEqual({ deleted: true });
      expect(mockUser.destroy).toHaveBeenCalledTimes(1);
    });

    it('prevents student from changing role or viewing another user', async () => {
      const viewOther = await request(app)
        .get(`/api/users/${OTHER_STUDENT_ID}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(viewOther.status).toBe(403);

      const escalateRole = await request(app)
        .patch(`/api/users/${STUDENT_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'admin' });

      expect(escalateRole.status).toBe(403);
    });
  });

  describe('Courses CRUD (/api/courses)', () => {
    it('returns paginated published courses for students and allows admin CRUD with soft delete when no progress exists', async () => {
      const findAndCountSpy = vi
        .spyOn(Course, 'findAndCountAll')
        .mockResolvedValueOnce({ rows: [], count: 0 } as never);
      const listRes = await request(app)
        .get('/api/courses?page=2&limit=5&title=Emprendimiento')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toEqual({
        success: true,
        data: [],
        total: 0,
        page: 2,
        totalPages: 0,
      });
      expect(findAndCountSpy.mock.calls[0][0]?.where).toMatchObject({ is_published: true });
      expect(findAndCountSpy.mock.calls[0][0]).toMatchObject({ limit: 5, offset: 5 });

      const mockCourse = {
        id: COURSE_ID,
        title: 'Nuevo Curso',
        description: 'Contenido',
        is_published: true,
        update: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      } as unknown as Course;

      vi.spyOn(Course, 'create').mockResolvedValueOnce(mockCourse);
      const createRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Nuevo Curso', description: 'Contenido', is_published: true });

      expect(createRes.status).toBe(201);

      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      vi.spyOn(LessonProgress, 'count').mockResolvedValueOnce(0);
      const delRes = await request(app)
        .delete(`/api/courses/${COURSE_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(mockCourse.destroy).toHaveBeenCalledTimes(1);
    });

    it('returns 409 Conflict when deleting a course that has LessonProgress records', async () => {
      const mockCourse = {
        id: COURSE_ID,
        title: 'Curso Activo',
        destroy: vi.fn().mockResolvedValue(undefined),
      } as unknown as Course;

      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      vi.spyOn(LessonProgress, 'count').mockResolvedValueOnce(4);

      const delRes = await request(app)
        .delete(`/api/courses/${COURSE_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(409);
      expect(delRes.body.success).toBe(false);
      expect(delRes.body.error.code).toBe('COURSE_HAS_PROGRESS');
      expect(mockCourse.destroy).not.toHaveBeenCalled();
    });

    it('returns 400 when date range or progress range query params are inverted', async () => {
      const badDateRes = await request(app)
        .get('/api/courses?startDate=2026-12-31&endDate=2026-01-01')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(badDateRes.status).toBe(400);

      const badProgressRes = await request(app)
        .get('/api/courses?minProgress=80&maxProgress=20')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(badProgressRes.status).toBe(400);
    });
  });

  describe('Lessons CRUD (/api/lessons)', () => {
    it('allows admin to create and soft-delete a lesson', async () => {
      const mockCourse = { id: COURSE_ID, is_published: true } as Course;
      const mockLesson = {
        id: LESSON_ID,
        course_id: COURSE_ID,
        title: 'Lección 1',
        content: 'Texto',
        order_index: 1,
        destroy: vi.fn().mockResolvedValue(undefined),
      } as unknown as Lesson;

      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      vi.spyOn(Lesson, 'create').mockResolvedValueOnce(mockLesson);

      const createRes = await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course_id: COURSE_ID,
          title: 'Lección 1',
          content: 'Texto',
          order_index: 1,
        });

      expect(createRes.status).toBe(201);

      vi.spyOn(Lesson, 'findByPk').mockResolvedValueOnce(mockLesson);
      const delRes = await request(app)
        .delete(`/api/lessons/${LESSON_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(mockLesson.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress CRUD (/api/progress)', () => {
    it('records student lesson progress and updates last_activity_at', async () => {
      const mockUser = {
        id: STUDENT_ID,
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as User;
      const mockCourse = { id: COURSE_ID } as Course;
      const mockLesson = { id: LESSON_ID, course_id: COURSE_ID } as Lesson;
      const mockProgress = {
        id: PROGRESS_ID,
        user_id: STUDENT_ID,
        course_id: COURSE_ID,
        lesson_id: LESSON_ID,
        completed: true,
        completed_at: new Date(),
      } as unknown as LessonProgress;

      vi.spyOn(User, 'findByPk').mockResolvedValueOnce(mockUser);
      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      vi.spyOn(Lesson, 'findByPk').mockResolvedValueOnce(mockLesson);
      vi.spyOn(LessonProgress, 'findOne').mockResolvedValueOnce(null);
      vi.spyOn(LessonProgress, 'create').mockResolvedValueOnce(mockProgress);
      const classifySpy = vi
        .spyOn(automationService, 'evaluateAndClassifyStudent')
        .mockResolvedValueOnce({
          score: 70,
          completionPercentage: 50,
          recencyScore: 100,
          daysSinceLastActivity: 0,
          classification: 'En progreso',
        });

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          course_id: COURSE_ID,
          lesson_id: LESSON_ID,
          completed: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.completed).toBe(true);
      expect(mockUser.update).toHaveBeenCalledWith({
        last_activity_at: expect.any(Date),
      });
      expect(classifySpy).toHaveBeenCalledWith(STUDENT_ID);
    });

    it('rejects progress when lesson does not belong to specified course', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValueOnce({ id: STUDENT_ID } as User);
      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce({ id: COURSE_ID } as Course);
      vi.spyOn(Lesson, 'findByPk').mockResolvedValueOnce({
        id: LESSON_ID,
        course_id: '20000000-0000-4000-8000-000000000099',
      } as Lesson);

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          course_id: COURSE_ID,
          lesson_id: LESSON_ID,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('LESSON_COURSE_MISMATCH');
    });

    it('forbids student from modifying another student progress record', async () => {
      vi.spyOn(LessonProgress, 'findByPk').mockResolvedValueOnce({
        id: PROGRESS_ID,
        user_id: OTHER_STUDENT_ID,
      } as LessonProgress);

      const response = await request(app)
        .patch(`/api/progress/${PROGRESS_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ completed: false });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Global Error Handler (Sequelize errors)', () => {
    it('maps UniqueConstraintError to 409 and ValidationError to 400', () => {
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const res = { status } as unknown as Response;
      const req = {} as Request;
      const next = vi.fn() as unknown as NextFunction;

      errorHandler(new UniqueConstraintError({ message: 'Duplicate' }), req, res, next);
      expect(status).toHaveBeenCalledWith(409);

      errorHandler(new ValidationError('Invalid'), req, res, next);
      expect(status).toHaveBeenCalledWith(400);
    });
  });
});
