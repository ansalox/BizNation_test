"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const health_controller_1 = require("./health.controller");
exports.healthRouter = (0, express_1.Router)();
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Service liveness check
 *     description: Returns basic service availability metadata for load balancers (AWS ALB / ECS).
 *     responses:
 *       200:
 *         description: Service is alive and accepting requests.
 */
exports.healthRouter.get('/', health_controller_1.healthController.getHealth);
/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Service and database readiness check
 *     description: Verifies connectivity to PostgreSQL via Sequelize.
 *     responses:
 *       200:
 *         description: Service and database are ready.
 *       503:
 *         description: Database connection is unavailable.
 */
exports.healthRouter.get('/ready', health_controller_1.healthController.getReadiness);
//# sourceMappingURL=health.router.js.map