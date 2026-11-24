"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const errorHandler_1 = require("../../middlewares/errorHandler");
class AuthController {
    service;
    constructor(service = auth_service_1.authService) {
        this.service = service;
    }
    register = async (req, res, next) => {
        try {
            const result = await this.service.register(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const result = await this.service.login(req.body);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication is required', 401, 'UNAUTHORIZED');
            }
            const user = await this.service.getProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map