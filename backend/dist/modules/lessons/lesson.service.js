"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonService = exports.LessonService = void 0;
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
class LessonService {
    async findAll(courseId, actor) {
        const courseWhere = actor?.role !== 'admin' ? { is_published: true } : undefined;
        return models_1.Lesson.findAll({
            where: courseId ? { course_id: courseId } : undefined,
            include: [
                {
                    model: models_1.Course,
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
    async findById(id, actor) {
        const lesson = await models_1.Lesson.findByPk(id, {
            include: [{ model: models_1.Course, as: 'course' }],
        });
        if (!lesson || (actor?.role !== 'admin' && !lesson.course?.is_published)) {
            throw new errorHandler_1.AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
        }
        return lesson;
    }
    async create(input) {
        const course = await models_1.Course.findByPk(input.course_id);
        if (!course) {
            throw new errorHandler_1.AppError('Course not found', 404, 'COURSE_NOT_FOUND');
        }
        return models_1.Lesson.create({
            course_id: input.course_id,
            title: input.title.trim(),
            content: input.content?.trim() ?? '',
            order_index: input.order_index ?? 0,
        });
    }
    async update(id, input) {
        const lesson = await models_1.Lesson.findByPk(id);
        if (!lesson) {
            throw new errorHandler_1.AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
        }
        if (input.course_id !== undefined && input.course_id !== lesson.course_id) {
            const targetCourse = await models_1.Course.findByPk(input.course_id);
            if (!targetCourse) {
                throw new errorHandler_1.AppError('Target course not found', 404, 'COURSE_NOT_FOUND');
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
    async softDelete(id) {
        const lesson = await models_1.Lesson.findByPk(id);
        if (!lesson) {
            throw new errorHandler_1.AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
        }
        await lesson.destroy();
    }
}
exports.LessonService = LessonService;
exports.lessonService = new LessonService();
//# sourceMappingURL=lesson.service.js.map