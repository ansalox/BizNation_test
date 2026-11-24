import { Course, Lesson, LessonProgress, User } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { automationService } from '../automation/automation.service';

export interface ProgressFilter {
  userId?: string;
  courseId?: string;
}

export interface UpsertProgressInput {
  user_id?: string;
  course_id: string;
  lesson_id: string;
  completed?: boolean;
}

export interface UpdateProgressInput {
  completed: boolean;
}

export class ProgressService {
  private ensureOwnershipOrAdmin(recordUserId: string, actor?: AuthenticatedUser): void {
    if (actor && actor.role !== 'admin' && recordUserId !== actor.id) {
      throw new AppError('Insufficient permissions for this progress record', 403, 'FORBIDDEN');
    }
  }

  async findAll(filters: ProgressFilter, actor?: AuthenticatedUser): Promise<LessonProgress[]> {
    let targetUserId = filters.userId;

    if (actor && actor.role !== 'admin') {
      if (targetUserId && targetUserId !== actor.id) {
        throw new AppError('Students can only query their own progress', 403, 'FORBIDDEN');
      }
      targetUserId = actor.id;
    }

    const where: Record<string, string> = {};
    if (targetUserId) {
      where.user_id = targetUserId;
    }
    if (filters.courseId) {
      where.course_id = filters.courseId;
    }

    return LessonProgress.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title', 'order_index'] },
      ],
      order: [['updated_at', 'DESC']],
    });
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<LessonProgress> {
    const progress = await LessonProgress.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title', 'order_index'] },
      ],
    });

    if (!progress) {
      throw new AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
    }

    this.ensureOwnershipOrAdmin(progress.user_id, actor);
    return progress;
  }

  async recordProgress(
    input: UpsertProgressInput,
    actor: AuthenticatedUser,
  ): Promise<{ progress: LessonProgress; created: boolean }> {
    const targetUserId = input.user_id ?? actor.id;
    this.ensureOwnershipOrAdmin(targetUserId, actor);

    const [user, course, lesson] = await Promise.all([
      User.findByPk(targetUserId),
      Course.findByPk(input.course_id),
      Lesson.findByPk(input.lesson_id),
    ]);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }
    if (lesson.course_id !== course.id) {
      throw new AppError(
        'Lesson does not belong to the specified course',
        400,
        'LESSON_COURSE_MISMATCH',
      );
    }

    const completed = input.completed ?? true;
    const now = new Date();
    const completedAt = completed ? now : null;

    const existing = await LessonProgress.findOne({
      where: {
        user_id: targetUserId,
        lesson_id: input.lesson_id,
      },
    });

    let progress: LessonProgress;
    let created = false;

    if (existing) {
      progress = await existing.update({
        course_id: input.course_id,
        completed,
        completed_at: completedAt,
      });
    } else {
      progress = await LessonProgress.create({
        user_id: targetUserId,
        course_id: input.course_id,
        lesson_id: input.lesson_id,
        completed,
        completed_at: completedAt,
      });
      created = true;
    }

    await user.update({ last_activity_at: now });
    await automationService.evaluateAndClassifyStudent(targetUserId);

    return { progress, created };
  }

  async update(
    id: string,
    input: UpdateProgressInput,
    actor?: AuthenticatedUser,
  ): Promise<LessonProgress> {
    const progress = await LessonProgress.findByPk(id);
    if (!progress) {
      throw new AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
    }

    this.ensureOwnershipOrAdmin(progress.user_id, actor);

    const now = new Date();
    await progress.update({
      completed: input.completed,
      completed_at: input.completed ? now : null,
    });

    await User.update({ last_activity_at: now }, { where: { id: progress.user_id } });
    await automationService.evaluateAndClassifyStudent(progress.user_id);

    return progress;
  }

  async softDelete(id: string, actor?: AuthenticatedUser): Promise<void> {
    const progress = await LessonProgress.findByPk(id);
    if (!progress) {
      throw new AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
    }

    this.ensureOwnershipOrAdmin(progress.user_id, actor);
    await progress.destroy();
  }
}

export const progressService = new ProgressService();
