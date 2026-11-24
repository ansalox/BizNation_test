"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = exports.CourseService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errorHandler_1 = require("../../middlewares/errorHandler");
const roundPercentage = (value) => Number(Math.min(100, Math.max(0, value)).toFixed(2));
const toPlainCourse = (course) => typeof course.get === 'function'
    ? course.get({ plain: true })
    : course;
class CourseService {
    buildWhereClause(actor, query) {
        const where = {};
        if (actor?.role !== 'admin') {
            where.is_published = true;
        }
        else if (query.onlyPublished !== undefined) {
            where.is_published = query.onlyPublished;
        }
        if (query.title) {
            where.title = { [sequelize_1.Op.iLike]: `%${query.title}%` };
        }
        if (query.startDate || query.endDate) {
            const dateRange = {};
            if (query.startDate) {
                dateRange[sequelize_1.Op.gte] = query.startDate;
            }
            if (query.endDate) {
                dateRange[sequelize_1.Op.lte] = query.endDate;
            }
            where.created_at = dateRange;
        }
        return where;
    }
    async enrichCoursesWithProgress(courses, actor) {
        if (courses.length === 0) {
            return [];
        }
        const courseIds = courses.map((course) => course.id);
        if (actor?.role === 'admin') {
            const progressRows = await models_1.LessonProgress.findAll({
                where: {
                    course_id: { [sequelize_1.Op.in]: courseIds },
                    completed: true,
                },
                attributes: ['course_id', 'user_id', 'lesson_id', 'completed'],
            });
            const progressByCourse = new Map();
            for (const row of progressRows) {
                if (!row.completed) {
                    continue;
                }
                let studentMap = progressByCourse.get(row.course_id);
                if (!studentMap) {
                    studentMap = new Map();
                    progressByCourse.set(row.course_id, studentMap);
                }
                let lessonSet = studentMap.get(row.user_id);
                if (!lessonSet) {
                    lessonSet = new Set();
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
                    ...plain,
                    lessons,
                    totalLessons,
                    metrics: {
                        totalStudentsWithProgress,
                        averageProgressPercentage,
                    },
                };
            });
        }
        const completedByCourse = new Map();
        if (actor?.id) {
            const progressRows = await models_1.LessonProgress.findAll({
                where: {
                    course_id: { [sequelize_1.Op.in]: courseIds },
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
                    lessonSet = new Set();
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
            const progressPercentage = totalLessons > 0 ? roundPercentage((completedLessons / totalLessons) * 100) : 0;
            return {
                ...plain,
                lessons,
                totalLessons,
                completedLessons,
                progressPercentage,
            };
        });
    }
    async findAll(actor, query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const offset = (page - 1) * limit;
        const where = this.buildWhereClause(actor, query);
        const hasProgressFilter = query.minProgress !== undefined || query.maxProgress !== undefined;
        const commonQueryOptions = {
            where,
            include: [
                {
                    model: models_1.Lesson,
                    as: 'lessons',
                    required: false,
                },
            ],
            order: [
                ['created_at', 'DESC'],
                [{ model: models_1.Lesson, as: 'lessons' }, 'order_index', 'ASC'],
            ],
        };
        if (!hasProgressFilter) {
            const { rows, count } = await models_1.Course.findAndCountAll({
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
        const matchingCourses = await models_1.Course.findAll(commonQueryOptions);
        const enriched = await this.enrichCoursesWithProgress(matchingCourses, actor);
        const filtered = enriched.filter((course) => {
            const progressValue = actor?.role === 'admin'
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
    async findById(id, actor) {
        const course = await models_1.Course.findByPk(id, {
            include: [
                {
                    model: models_1.Lesson,
                    as: 'lessons',
                    required: false,
                },
            ],
            order: [[{ model: models_1.Lesson, as: 'lessons' }, 'order_index', 'ASC']],
        });
        if (!course || (actor?.role !== 'admin' && !course.is_published)) {
            throw new errorHandler_1.AppError('Course not found', 404, 'COURSE_NOT_FOUND');
        }
        const [enriched] = await this.enrichCoursesWithProgress([course], actor);
        return enriched;
    }
    async create(input) {
        return models_1.Course.create({
            title: input.title.trim(),
            description: input.description?.trim() ?? '',
            is_published: input.is_published ?? false,
        });
    }
    async update(id, input) {
        const course = await models_1.Course.findByPk(id);
        if (!course) {
            throw new errorHandler_1.AppError('Course not found', 404, 'COURSE_NOT_FOUND');
        }
        await course.update({
            ...(input.title !== undefined ? { title: input.title.trim() } : {}),
            ...(input.description !== undefined ? { description: input.description.trim() } : {}),
            ...(input.is_published !== undefined ? { is_published: input.is_published } : {}),
        });
        return course;
    }
    async softDelete(id) {
        const course = await models_1.Course.findByPk(id);
        if (!course) {
            throw new errorHandler_1.AppError('Course not found', 404, 'COURSE_NOT_FOUND');
        }
        const existingProgressCount = await models_1.LessonProgress.count({
            where: { course_id: id },
        });
        if (existingProgressCount > 0) {
            throw new errorHandler_1.AppError('Cannot delete course because students already have recorded lesson progress for this course', 409, 'COURSE_HAS_PROGRESS');
        }
        await course.destroy();
    }
}
exports.CourseService = CourseService;
exports.courseService = new CourseService();
//# sourceMappingURL=course.service.js.map