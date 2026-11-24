"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressController = exports.ProgressController = void 0;
const errorHandler_1 = require("../../middlewares/errorHandler");
const validation_1 = require("../../utils/validation");
const progress_service_1 = require("./progress.service");
class ProgressController {
    service;
    constructor(service = progress_service_1.progressService) {
        this.service = service;
    }
    list = async (req, res, next) => {
        try {
            const userId = typeof req.query.userId === 'string' && req.query.userId.length > 0
                ? (0, validation_1.parseUuid)(req.query.userId, 'userId')
                : undefined;
            const courseId = typeof req.query.courseId === 'string' && req.query.courseId.length > 0
                ? (0, validation_1.parseUuid)(req.query.courseId, 'courseId')
                : undefined;
            const records = await this.service.findAll({ userId, courseId }, req.user);
            res.status(200).json({
                success: true,
                data: records,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const record = await this.service.findById(String(req.params.id), req.user);
            res.status(200).json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    };
    record = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication is required', 401, 'UNAUTHORIZED');
            }
            const { progress, created } = await this.service.recordProgress(req.body, req.user);
            res.status(created ? 201 : 200).json({
                success: true,
                data: progress,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const record = await this.service.update(String(req.params.id), req.body, req.user);
            res.status(200).json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    };
    remove = async (req, res, next) => {
        try {
            await this.service.softDelete(String(req.params.id), req.user);
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
exports.ProgressController = ProgressController;
exports.progressController = new ProgressController();
//# sourceMappingURL=progress.controller.js.map