import { Course, Lesson } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

export interface CreateLessonInput {
  course_id: string;
  title: string;
  content?: string;
  order_index?: number;
}

export interface UpdateLessonInput {
  course_id?: string;
  title?: string;
  content?: string;
  order_index?: number;
}

export class LessonService {
  async findAll(courseId?: string, actor?: AuthenticatedUser): Promise<Lesson[]> {
    const courseWhere = actor?.role !== 'admin' ? { is_published: true } : undefined;

    return Lesson.findAll({
      where: courseId ? { course_id: courseId } : undefined,
      include: [
        {
          model: Course,
          as: 'course',
          where: courseWhere,
          required: Boolean(courseWhere),
        },
      ],
      order: [
        ['order_index', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Lesson> {
    const lesson = await Lesson.findByPk(id, {
      include: [{ model: Course, as: 'course' }],
    });

    if (!lesson || (actor?.role !== 'admin' && !lesson.course?.is_published)) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    return lesson;
  }

  async create(input: CreateLessonInput): Promise<Lesson> {
    const course = await Course.findByPk(input.course_id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    return Lesson.create({
      course_id: input.course_id,
      title: input.title.trim(),
      content: input.content?.trim() ?? '',
      order_index: input.order_index ?? 0,
    });
  }

  async update(id: string, input: UpdateLessonInput): Promise<Lesson> {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    if (input.course_id !== undefined && input.course_id !== lesson.course_id) {
      const targetCourse = await Course.findByPk(input.course_id);
      if (!targetCourse) {
        throw new AppError('Target course not found', 404, 'COURSE_NOT_FOUND');
      }
    }

    await lesson.update({
      ...(input.course_id !== undefined ? { course_id: input.course_id } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.order_index !== undefined ? { order_index: input.order_index } : {}),
    });

    return lesson;
  }

  async softDelete(id: string): Promise<void> {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }
    await lesson.destroy();
  }
}

export const lessonService = new LessonService();
