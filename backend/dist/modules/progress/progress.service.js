"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressService = exports.ProgressService = void 0;
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
const automation_service_1 = require("../automation/automation.service");
class ProgressService {
    ensureOwnershipOrAdmin(recordUserId, actor) {
        if (actor && actor.role !== 'admin' && recordUserId !== actor.id) {
            throw new errorHandler_1.AppError('Insufficient permissions for this progress record', 403, 'FORBIDDEN');
        }
    }
    async findAll(filters, actor) {
        let targetUserId = filters.userId;
        if (actor && actor.role !== 'admin') {
            if (targetUserId && targetUserId !== actor.id) {
                throw new errorHandler_1.AppError('Students can only query their own progress', 403, 'FORBIDDEN');
            }
            targetUserId = actor.id;
        }
        const where = {};
        if (targetUserId) {
            where.user_id = targetUserId;
        }
        if (filters.courseId) {
            where.course_id = filters.courseId;
        }
        return models_1.LessonProgress.findAll({
            where,
            include: [
                { model: models_1.Course, as: 'course', attributes: ['id', 'title'] },
                { model: models_1.Lesson, as: 'lesson', attributes: ['id', 'title', 'order_index'] },
            ],
            order: [['updated_at', 'DESC']],
        });
    }
    async findById(id, actor) {
        const progress = await models_1.LessonProgress.findByPk(id, {
            include: [
                { model: models_1.Course, as: 'course', attributes: ['id', 'title'] },
                { model: models_1.Lesson, as: 'lesson', attributes: ['id', 'title', 'order_index'] },
            ],
        });
        if (!progress) {
            throw new errorHandler_1.AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
        }
        this.ensureOwnershipOrAdmin(progress.user_id, actor);
        return progress;
    }
    async recordProgress(input, actor) {
        const targetUserId = input.user_id ?? actor.id;
        this.ensureOwnershipOrAdmin(targetUserId, actor);
        const [user, course, lesson] = await Promise.all([
            models_1.User.findByPk(targetUserId),
            models_1.Course.findByPk(input.course_id),
            models_1.Lesson.findByPk(input.lesson_id),
        ]);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (!course) {
            throw new errorHandler_1.AppError('Course not found', 404, 'COURSE_NOT_FOUND');
        }
        if (!lesson) {
            throw new errorHandler_1.AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
        }
        if (lesson.course_id !== course.id) {
            throw new errorHandler_1.AppError('Lesson does not belong to the specified course', 400, 'LESSON_COURSE_MISMATCH');
        }
        const completed = input.completed ?? true;
        const now = new Date();
        const completedAt = completed ? now : null;
        const existing = await models_1.LessonProgress.findOne({
            where: {
                user_id: targetUserId,
                lesson_id: input.lesson_id,
            },
        });
        let progress;
        let created = false;
        if (existing) {
            progress = await existing.update({
                course_id: input.course_id,
                completed,
                completed_at: completedAt,
            });
        }
        else {
            progress = await models_1.LessonProgress.create({
                user_id: targetUserId,
                course_id: input.course_id,
                lesson_id: input.lesson_id,
                completed,
                completed_at: completedAt,
            });
            created = true;
        }
        await user.update({ last_activity_at: now });
        await automation_service_1.automationService.evaluateAndClassifyStudent(targetUserId);
        return { progress, created };
    }
    async update(id, input, actor) {
        const progress = await models_1.LessonProgress.findByPk(id);
        if (!progress) {
            throw new errorHandler_1.AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
        }
        this.ensureOwnershipOrAdmin(progress.user_id, actor);
        const now = new Date();
        await progress.update({
            completed: input.completed,
            completed_at: input.completed ? now : null,
        });
        await models_1.User.update({ last_activity_at: now }, { where: { id: progress.user_id } });
        await automation_service_1.automationService.evaluateAndClassifyStudent(progress.user_id);
        return progress;
    }
    async softDelete(id, actor) {
        const progress = await models_1.LessonProgress.findByPk(id);
        if (!progress) {
            throw new errorHandler_1.AppError('Progress record not found', 404, 'PROGRESS_NOT_FOUND');
        }
        this.ensureOwnershipOrAdmin(progress.user_id, actor);
        await progress.destroy();
    }
}
exports.ProgressService = ProgressService;
exports.progressService = new ProgressService();
//# sourceMappingURL=progress.service.js.map