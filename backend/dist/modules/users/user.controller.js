"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    service;
    constructor(service = user_service_1.userService) {
        this.service = service;
    }
    list = async (_req, res, next) => {
        try {
            const users = await this.service.findAll();
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const user = await this.service.findById(String(req.params.id), req.user);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const user = await this.service.create(req.body);
            res.status(201).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const user = await this.service.update(String(req.params.id), req.body, req.user);
            res.status(200).json({
                success: true,
                data: user,
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
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map