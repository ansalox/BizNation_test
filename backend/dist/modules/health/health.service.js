"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = exports.HealthService = void 0;
const database_1 = require("../../database");
const env_1 = require("../../config/env");
class HealthService {
    getLiveness() {
        return {
            status: 'ok',
            service: 'biznation-backend',
            environment: env_1.env.nodeEnv,
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
        };
    }
    async getReadiness() {
        const database = await (0, database_1.checkDatabaseConnection)();
        return {
            ...this.getLiveness(),
            database,
        };
    }
}
exports.HealthService = HealthService;
exports.healthService = new HealthService();
//# sourceMappingURL=health.service.js.map