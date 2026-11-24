"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationController = exports.AutomationController = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../utils/validation");
const automation_service_1 = require("./automation.service");
const listAlertsQuerySchema = zod_1.z.object({
    page: zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce.number().int().min(1).default(1)),
    limit: zod_1.z.preprocess((val) => (val === '' || val === undefined ? undefined : val), zod_1.z.coerce.number().int().min(1).max(100).default(20)),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    sentiment: zod_1.z.enum(['positive', 'neutral', 'negative']).optional(),
    status: zod_1.z.enum(['open', 'reviewed', 'resolved']).optional(),
});
class AutomationController {
    service;
    constructor(service = automation_service_1.automationService) {
        this.service = service;
    }
    getStudentsReport = async (_req, res, next) => {
        try {
            const report = await this.service.getStudentsReport();
            res.status(200).json({
                success: true,
                data: report.data,
                summary: report.summary,
            });
        }
        catch (error) {
            next(error);
        }
    };
    listAlerts = async (req, res, next) => {
        try {
            const query = (0, validation_1.parseWithSchema)(listAlertsQuerySchema, req.query);
            const result = await this.service.listAlerts(query);
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
    updateAlertStatus = async (req, res, next) => {
        try {
            const { status } = req.body;
            const alert = await this.service.updateAlertStatus(String(req.params.id), status);
            res.status(200).json({
                success: true,
                data: alert,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AutomationController = AutomationController;
exports.automationController = new AutomationController();
//# sourceMappingURL=automation.controller.js.map