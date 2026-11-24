import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import './database/models';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFound';
import type { RequestWithRawBody } from './middlewares/webhookSignature.middleware';
import { authRouter } from './modules/auth/auth.router';
import { automationRouter } from './modules/automation/automation.router';
import { coursesRouter } from './modules/courses/course.router';
import { healthRouter } from './modules/health/health.router';
import { lessonsRouter } from './modules/lessons/lesson.router';
import { progressRouter } from './modules/progress/progress.router';
import { usersRouter } from './modules/users/user.router';
import { webhooksRouter } from './modules/webhooks/webhook.router';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  // OpenAPI / Swagger documentation at /api/docs (and /api/docs.json)
  app.get('/api/docs.json', (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Keep /api-docs alias pointing to the same spec for backwards compatibility
  app.get('/api-docs.json', (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health endpoints (root level for AWS ALB / ECS target group checks)
  app.use('/health', healthRouter);

  // Versioned / prefixed REST API modules (Router -> Controller -> Service -> Model)
  const apiRouter = Router();
  apiRouter.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        name: 'Biz Nation API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/health',
      },
    });
  });

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/courses', coursesRouter);
  apiRouter.use('/lessons', lessonsRouter);
  apiRouter.use('/progress', progressRouter);
  apiRouter.use('/webhooks', webhooksRouter);
  apiRouter.use('/automation', automationRouter);

  app.use(env.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
