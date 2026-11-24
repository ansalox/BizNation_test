"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = exports.HealthController = void 0;
const health_service_1 = require("./health.service");
class HealthController {
    service;
    constructor(service = health_service_1.healthService) {
        this.service = service;
    }
    getHealth = (_req, res, next) => {
        try {
            const payload = this.service.getLiveness();
            res.status(200).json({
                success: true,
                data: payload,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getReadiness = async (_req, res, next) => {
        try {
            const payload = await this.service.getReadiness();
            const httpStatus = payload.database.status === 'up' ? 200 : 503;
            res.status(httpStatus).json({
                success: payload.database.status === 'up',
                data: payload,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.HealthController = HealthController;
exports.healthController = new HealthController();
//# sourceMappingURL=health.controller.js.map