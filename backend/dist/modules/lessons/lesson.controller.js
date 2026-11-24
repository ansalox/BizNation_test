"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonController = exports.LessonController = void 0;
const validation_1 = require("../../utils/validation");
const lesson_service_1 = require("./lesson.service");
class LessonController {
    service;
    constructor(service = lesson_service_1.lessonService) {
        this.service = service;
    }
    list = async (req, res, next) => {
        try {
            const courseId = typeof req.query.courseId === 'string' && req.query.courseId.length > 0
                ? (0, validation_1.parseUuid)(req.query.courseId, 'courseId')
                : undefined;
            const lessons = await this.service.findAll(courseId, req.user);
            res.status(200).json({
                success: true,
                data: lessons,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const lesson = await this.service.findById(String(req.params.id), req.user);
            res.status(200).json({
                success: true,
                data: lesson,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const lesson = await this.service.create(req.body);
            res.status(201).json({
                success: true,
                data: lesson,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const lesson = await this.service.update(String(req.params.id), req.body);
            res.status(200).json({
                success: true,
                data: lesson,
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
exports.LessonController = LessonController;
exports.lessonController = new LessonController();
//# sourceMappingURL=lesson.controller.js.map