import { Op } from 'sequelize';
import { describe, expect, it, vi } from 'vitest';
import { Course, LessonProgress } from '../src/database/models';
import { AppError } from '../src/middlewares/errorHandler';
import type { AuthenticatedUser } from '../src/middlewares/auth.middleware';
import { CourseService } from '../src/modules/courses/course.service';

const ADMIN_USER: AuthenticatedUser = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'admin@biznation.com',
  role: 'admin',
};

const STUDENT_USER: AuthenticatedUser = {
  id: '10000000-0000-4000-8000-000000000002',
  email: 'laura@biznation.com',
  role: 'student',
};

const COURSE_1_ID = '20000000-0000-4000-8000-000000000001';
const COURSE_2_ID = '20000000-0000-4000-8000-000000000002';

function makeMockCourse(overrides: {
  id: string;
  title: string;
  is_published: boolean;
  lessons?: Array<{ id: string; order_index: number }>;
}) {
  const now = new Date();
  const destroy = vi.fn().mockResolvedValue(undefined);
  const plain = {
    id: overrides.id,
    title: overrides.title,
    description: 'Course description',
    is_published: overrides.is_published,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    lessons: overrides.lessons ?? [],
  };

  return {
    ...plain,
    destroy,
    get: () => plain,
  } as unknown as Course & { destroy: ReturnType<typeof vi.fn> };
}

describe('CourseService (Unit Tests)', () => {
  const service = new CourseService();

  describe('softDelete()', () => {
    it('blocks deletion with 409 Conflict when LessonProgress records exist for the course', async () => {
      const mockCourse = makeMockCourse({
        id: COURSE_1_ID,
        title: 'Curso con Progreso',
        is_published: true,
      });

      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      const countSpy = vi.spyOn(LessonProgress, 'count').mockResolvedValueOnce(3);

      await expect(service.softDelete(COURSE_1_ID)).rejects.toMatchObject({
        statusCode: 409,
        code: 'COURSE_HAS_PROGRESS',
      });

      try {
        vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
        vi.spyOn(LessonProgress, 'count').mockResolvedValueOnce(1);
        await service.softDelete(COURSE_1_ID);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(409);
      }

      expect(countSpy).toHaveBeenCalledWith({ where: { course_id: COURSE_1_ID } });
      expect(mockCourse.destroy).not.toHaveBeenCalled();
    });

    it('allows soft deletion when no LessonProgress records exist for the course', async () => {
      const mockCourse = makeMockCourse({
        id: COURSE_1_ID,
        title: 'Curso sin Progreso',
        is_published: false,
      });

      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(mockCourse);
      const countSpy = vi.spyOn(LessonProgress, 'count').mockResolvedValueOnce(0);

      await service.softDelete(COURSE_1_ID);

      expect(countSpy).toHaveBeenCalledWith({ where: { course_id: COURSE_1_ID } });
      expect(mockCourse.destroy).toHaveBeenCalledTimes(1);
    });

    it('throws 404 Not Found when course does not exist', async () => {
      vi.spyOn(Course, 'findByPk').mockResolvedValueOnce(null);

      await expect(service.softDelete(COURSE_1_ID)).rejects.toMatchObject({
        statusCode: 404,
        code: 'COURSE_NOT_FOUND',
      });
    });
  });

  describe('findAll() - Role Visibility, Pagination, Filters & Progress Metrics', () => {
    it('restricts student to published courses, applies filters, and returns student progressPercentage', async () => {
      const course1 = makeMockCourse({
        id: COURSE_1_ID,
        title: 'Emprendimiento Digital',
        is_published: true,
        lessons: [
          { id: 'l1', order_index: 1 },
          { id: 'l2', order_index: 2 },
        ],
      });

      const findAndCountSpy = vi
        .spyOn(Course, 'findAndCountAll')
        .mockResolvedValueOnce({ rows: [course1], count: 1 } as never);

      vi.spyOn(LessonProgress, 'findAll').mockResolvedValueOnce([
        {
          course_id: COURSE_1_ID,
          lesson_id: 'l1',
          completed: true,
        } as LessonProgress,
      ]);

      const startDate = new Date('2026-01-01T00:00:00.000Z');
      const endDate = new Date('2026-12-31T23:59:59.999Z');

      const result = await service.findAll(STUDENT_USER, {
        page: 1,
        limit: 5,
        title: 'Emprendimiento',
        startDate,
        endDate,
        onlyPublished: false, // Ignored for student role
      });

      const whereArg = findAndCountSpy.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(whereArg.is_published).toBe(true);
      expect(whereArg.title).toEqual({ [Op.iLike]: '%Emprendimiento%' });
      expect(whereArg.created_at).toEqual({ [Op.gte]: startDate, [Op.lte]: endDate });

      expect(result).toMatchObject({
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(result.data[0]).toMatchObject({
        id: COURSE_1_ID,
        totalLessons: 2,
        completedLessons: 1,
        progressPercentage: 50,
      });
      expect(result.data[0].metrics).toBeUndefined();
    });

    it('allows admin to see drafts and returns aggregated student count and average progress', async () => {
      const publishedCourse = makeMockCourse({
        id: COURSE_1_ID,
        title: 'Finanzas',
        is_published: true,
        lessons: [
          { id: 'l1', order_index: 1 },
          { id: 'l2', order_index: 2 },
        ],
      });
      const draftCourse = makeMockCourse({
        id: COURSE_2_ID,
        title: 'Borrador Interno',
        is_published: false,
        lessons: [{ id: 'l3', order_index: 1 }],
      });

      const findAndCountSpy = vi
        .spyOn(Course, 'findAndCountAll')
        .mockResolvedValueOnce({ rows: [publishedCourse, draftCourse], count: 2 } as never);

      // Student A completed 2/2 lessons (100%), Student B completed 1/2 lessons (50%) -> avg 75%
      vi.spyOn(LessonProgress, 'findAll').mockResolvedValueOnce([
        { course_id: COURSE_1_ID, user_id: 'u1', lesson_id: 'l1', completed: true },
        { course_id: COURSE_1_ID, user_id: 'u1', lesson_id: 'l2', completed: true },
        { course_id: COURSE_1_ID, user_id: 'u2', lesson_id: 'l1', completed: true },
      ] as LessonProgress[]);

      const result = await service.findAll(ADMIN_USER, { page: 1, limit: 10 });

      const whereArg = findAndCountSpy.mock.calls[0][0]?.where as Record<string, unknown>;
      expect(whereArg.is_published).toBeUndefined();

      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.data[0].metrics).toEqual({
        totalStudentsWithProgress: 2,
        averageProgressPercentage: 75,
      });
      expect(result.data[1].metrics).toEqual({
        totalStudentsWithProgress: 0,
        averageProgressPercentage: 0,
      });
    });

    it('filters by minProgress and maxProgress and computes accurate pagination totals', async () => {
      const courseHigh = makeMockCourse({
        id: COURSE_1_ID,
        title: 'Curso Avanzado',
        is_published: true,
        lessons: [
          { id: 'l1', order_index: 1 },
          { id: 'l2', order_index: 2 },
        ],
      });
      const courseLow = makeMockCourse({
        id: COURSE_2_ID,
        title: 'Curso Inicial',
        is_published: true,
        lessons: [
          { id: 'l3', order_index: 1 },
          { id: 'l4', order_index: 2 },
        ],
      });

      vi.spyOn(Course, 'findAll').mockResolvedValueOnce([courseHigh, courseLow]);
      vi.spyOn(LessonProgress, 'findAll').mockResolvedValueOnce([
        { course_id: COURSE_1_ID, lesson_id: 'l1', completed: true },
        { course_id: COURSE_1_ID, lesson_id: 'l2', completed: true },
      ] as LessonProgress[]);

      const result = await service.findAll(STUDENT_USER, {
        page: 1,
        limit: 1,
        minProgress: 50,
        maxProgress: 100,
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(COURSE_1_ID);
      expect(result.data[0].progressPercentage).toBe(100);
    });
  });
});
