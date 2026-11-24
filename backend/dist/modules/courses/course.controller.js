"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseController = exports.CourseController = void 0;
const zod_1 = require("zod");
const errorHandler_1 = require("../../middlewares/errorHandler");
const validation_1 = require("../../utils/validation");
const course_service_1 = require("./course.service");
const optionalPositiveInt = (defaultValue, maxValue) => zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce
    .number()
    .int()
    .min(1)
    .max(maxValue ?? Number.MAX_SAFE_INTEGER)
    .default(defaultValue));
const optionalProgressBound = zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce.number().min(0).max(100).optional());
const optionalDateString = zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Must be a valid ISO date or datetime string',
})
    .optional());
const listCoursesQuerySchema = zod_1.z.object({
    page: optionalPositiveInt(1),
    limit: optionalPositiveInt(10, 100),
    title: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim().length === 0 ? undefined : val), zod_1.z.string().trim().max(200).optional()),
    startDate: optionalDateString,
    endDate: optionalDateString,
    minProgress: optionalProgressBound,
    maxProgress: optionalProgressBound,
    published: zod_1.z.enum(['true', 'false']).optional(),
});
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function parseDateBoundary(raw, boundary) {
    if (DATE_ONLY_REGEX.test(raw)) {
        return new Date(boundary === 'start' ? `${raw}T00:00:00.000Z` : `${raw}T23:59:59.999Z`);
    }
    return new Date(raw);
}
class CourseController {
    service;
    constructor(service = course_service_1.courseService) {
        this.service = service;
    }
    list = async (req, res, next) => {
        try {
            const parsed = (0, validation_1.parseWithSchema)(listCoursesQuerySchema, req.query);
            const startDate = parsed.startDate
                ? parseDateBoundary(parsed.startDate, 'start')
                : undefined;
            const endDate = parsed.endDate
                ? parseDateBoundary(parsed.endDate, 'end')
                : undefined;
            if (startDate && endDate && startDate > endDate) {
                throw new errorHandler_1.AppError('startDate cannot be greater than endDate', 400, 'VALIDATION_ERROR');
            }
            if (parsed.minProgress !== undefined &&
                parsed.maxProgress !== undefined &&
                parsed.minProgress > parsed.maxProgress) {
                throw new errorHandler_1.AppError('minProgress cannot be greater than maxProgress', 400, 'VALIDATION_ERROR');
            }
            const query = {
                page: parsed.page,
                limit: parsed.limit,
                title: parsed.title,
                startDate,
                endDate,
                minProgress: parsed.minProgress,
                maxProgress: parsed.maxProgress,
                onlyPublished: parsed.published === 'true'
                    ? true
                    : parsed.published === 'false'
                        ? false
                        : undefined,
            };
            const result = await this.service.findAll(req.user, query);
            res.status(200).json({
                success: true,
                data: result.data,
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const course = await this.service.findById(String(req.params.id), req.user);
            res.status(200).json({
                success: true,
                data: course,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const course = await this.service.create(req.body);
            res.status(201).json({
                success: true,
                data: course,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const course = await this.service.update(String(req.params.id), req.body);
            res.status(200).json({
                success: true,
                data: course,
            });
        }
        catch (error) {
            next(error);
        }
    };
    remove = async (req, res, next) => {
        try {
            await this.service.softDelete(String(req.params.id));
            res.status(200).json({
                success: true,
                data: { deleted: true },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CourseController = CourseController;
exports.courseController = new CourseController();
//# sourceMappingURL=course.controller.js.map