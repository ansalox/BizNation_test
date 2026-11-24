import { Op, WhereOptions } from 'sequelize';
import { Course, Lesson, LessonProgress } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export interface CreateCourseInput {
  title: string;
  description?: string;
  is_published?: boolean;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  is_published?: boolean;
}

export interface CourseListQuery {
  page?: number;
  limit?: number;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  minProgress?: number;
  maxProgress?: number;
  onlyPublished?: boolean;
}

export interface AdminCourseMetrics {
  totalStudentsWithProgress: number;
  averageProgressPercentage: number;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  lessons: unknown[];
  totalLessons: number;
  completedLessons?: number;
  progressPercentage?: number;
  metrics?: AdminCourseMetrics;
}

export interface PaginatedCoursesResult {
  data: CourseResponse[];
  total: number;
  page: number;
  totalPages: number;
}

const roundPercentage = (value: number): number =>
  Number(Math.min(100, Math.max(0, value)).toFixed(2));

const toPlainCourse = (course: Course): Record<string, unknown> =>
  typeof course.get === 'function'
    ? (course.get({ plain: true }) as unknown as Record<string, unknown>)
    : (course as unknown as Record<string, unknown>);

export class CourseService {
  private buildWhereClause(
    actor: AuthenticatedUser | undefined,
    query: CourseListQuery,
  ): WhereOptions {
    const where: Record<string, unknown> = {};

    if (actor?.role !== 'admin') {
      where.is_published = true;
    } else if (query.onlyPublished !== undefined) {
      where.is_published = query.onlyPublished;
    }

    if (query.title) {
      where.title = { [Op.iLike]: `%${query.title}%` };
    }

    if (query.startDate || query.endDate) {
      const dateRange: Record<symbol, Date> = {};
      if (query.startDate) {
        dateRange[Op.gte] = query.startDate;
      }
      if (query.endDate) {
        dateRange[Op.lte] = query.endDate;
      }
      where.created_at = dateRange;
    }

    return where;
  }

  private async enrichCoursesWithProgress(
    courses: Course[],
    actor?: AuthenticatedUser,
  ): Promise<CourseResponse[]> {
    if (courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((course) => course.id);

    if (actor?.role === 'admin') {
      const progressRows = await LessonProgress.findAll({
        where: {
          course_id: { [Op.in]: courseIds },
          completed: true,
        },
        attributes: ['course_id', 'user_id', 'lesson_id', 'completed'],
      });

      const progressByCourse = new Map<string, Map<string, Set<string>>>();
      for (const row of progressRows) {
        if (!row.completed) {
          continue;
        }
        let studentMap = progressByCourse.get(row.course_id);
        if (!studentMap) {
          studentMap = new Map<string, Set<string>>();
          progressByCourse.set(row.course_id, studentMap);
        }
        let lessonSet = studentMap.get(row.user_id);
        if (!lessonSet) {
          lessonSet = new Set<string>();
          studentMap.set(row.user_id, lessonSet);
        }
        lessonSet.add(row.lesson_id);
      }

      return courses.map((course) => {
        const plain = toPlainCourse(course);
        const lessons = Array.isArray(plain.lessons) ? plain.lessons : [];
        const totalLessons = lessons.length;
        const studentMap = progressByCourse.get(course.id);
        const totalStudentsWithProgress = studentMap ? studentMap.size : 0;

        let averageProgressPercentage = 0;
        if (studentMap && totalStudentsWithProgress > 0 && totalLessons > 0) {
          let sumPercentages = 0;
          for (const completedLessonsSet of studentMap.values()) {
            sumPercentages += Math.min(100, (completedLessonsSet.size / totalLessons) * 100);
          }
          averageProgressPercentage = roundPercentage(sumPercentages / totalStudentsWithProgress);
        }

        return {
          ...(plain as unknown as CourseResponse),
          lessons,
          totalLessons,
          metrics: {
            totalStudentsWithProgress,
            averageProgressPercentage,
          },
        };
      });
    }

    const completedByCourse = new Map<string, Set<string>>();
    if (actor?.id) {
      const progressRows = await LessonProgress.findAll({
        where: {
          course_id: { [Op.in]: courseIds },
          user_id: actor.id,
          completed: true,
        },
        attributes: ['course_id', 'lesson_id', 'completed'],
      });

      for (const row of progressRows) {
        if (!row.completed) {
          continue;
        }
        let lessonSet = completedByCourse.get(row.course_id);
        if (!lessonSet) {
          lessonSet = new Set<string>();
          completedByCourse.set(row.course_id, lessonSet);
        }
        lessonSet.add(row.lesson_id);
      }
    }

    return courses.map((course) => {
      const plain = toPlainCourse(course);
      const lessons = Array.isArray(plain.lessons) ? plain.lessons : [];
      const totalLessons = lessons.length;
      const completedLessons = completedByCourse.get(course.id)?.size ?? 0;
      const progressPercentage =
        totalLessons > 0 ? roundPercentage((completedLessons / totalLessons) * 100) : 0;

      return {
        ...(plain as unknown as CourseResponse),
        lessons,
        totalLessons,
        completedLessons,
        progressPercentage,
      };
    });
  }

  async findAll(
    actor?: AuthenticatedUser,
    query: CourseListQuery = {},
  ): Promise<PaginatedCoursesResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(actor, query);

    const hasProgressFilter =
      query.minProgress !== undefined || query.maxProgress !== undefined;

    const commonQueryOptions = {
      where,
      include: [
        {
          model: Lesson,
          as: 'lessons',
          required: false,
        },
      ],
      order: [
        ['created_at', 'DESC'] as [string, string],
        [{ model: Lesson, as: 'lessons' }, 'order_index', 'ASC'] as [
          { model: typeof Lesson; as: string },
          string,
          string,
        ],
      ],
    };

    if (!hasProgressFilter) {
      const { rows, count } = await Course.findAndCountAll({
        ...commonQueryOptions,
        distinct: true,
        limit,
        offset,
      });

      const data = await this.enrichCoursesWithProgress(rows, actor);
      const total = typeof count === 'number' ? count : 0;

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }

    const matchingCourses = await Course.findAll(commonQueryOptions);
    const enriched = await this.enrichCoursesWithProgress(matchingCourses, actor);

    const filtered = enriched.filter((course) => {
      const progressValue =
        actor?.role === 'admin'
          ? (course.metrics?.averageProgressPercentage ?? 0)
          : (course.progressPercentage ?? 0);

      if (query.minProgress !== undefined && progressValue < query.minProgress) {
        return false;
      }
      if (query.maxProgress !== undefined && progressValue > query.maxProgress) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<CourseResponse> {
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Lesson,
          as: 'lessons',
          required: false,
        },
      ],
      order: [[{ model: Lesson, as: 'lessons' }, 'order_index', 'ASC']],
    });

    if (!course || (actor?.role !== 'admin' && !course.is_published)) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const [enriched] = await this.enrichCoursesWithProgress([course], actor);
    return enriched;
  }

  async create(input: CreateCourseInput): Promise<Course> {
    return Course.create({
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      is_published: input.is_published ?? false,
    });
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    const course = await Course.findByPk(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    await course.update({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.is_published !== undefined ? { is_published: input.is_published } : {}),
    });

    return course;
  }

  async softDelete(id: string): Promise<void> {
    const course = await Course.findByPk(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const existingProgressCount = await LessonProgress.count({
      where: { course_id: id },
    });

    if (existingProgressCount > 0) {
      throw new AppError(
        'Cannot delete course because students already have recorded lesson progress for this course',
        409,
        'COURSE_HAS_PROGRESS',
      );
    }

    await course.destroy();
  }
}

export const courseService = new CourseService();
