import { NextFunction, Request, Response } from 'express';
import { HealthService, healthService } from './health.service';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  getHealth = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const payload = this.service.getLiveness();
      res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  };

  getReadiness = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = await this.service.getReadiness();
      const httpStatus = payload.database.status === 'up' ? 200 : 503;
      res.status(httpStatus).json({
        success: payload.database.status === 'up',
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
