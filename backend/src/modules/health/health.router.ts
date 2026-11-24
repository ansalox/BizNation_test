import { Router } from 'express';
import { healthController } from './health.controller';

export const healthRouter: Router = Router();

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
healthRouter.get('/', healthController.getHealth);

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
healthRouter.get('/ready', healthController.getReadiness);
