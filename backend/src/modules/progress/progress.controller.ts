import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler';
import { parseUuid } from '../../utils/validation';
import {
  ProgressService,
  progressService,
  UpdateProgressInput,
  UpsertProgressInput,
} from './progress.service';

export class ProgressController {
  constructor(private readonly service: ProgressService = progressService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId =
        typeof req.query.userId === 'string' && req.query.userId.length > 0
          ? parseUuid(req.query.userId, 'userId')
          : undefined;
      const courseId =
        typeof req.query.courseId === 'string' && req.query.courseId.length > 0
          ? parseUuid(req.query.courseId, 'courseId')
          : undefined;

      const records = await this.service.findAll({ userId, courseId }, req.user);
      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.findById(String(req.params.id), req.user);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  record = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication is required', 401, 'UNAUTHORIZED');
      }
      const { progress, created } = await this.service.recordProgress(
        req.body as UpsertProgressInput,
        req.user,
      );
      res.status(created ? 201 : 200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.update(
        String(req.params.id),
        req.body as UpdateProgressInput,
        req.user,
      );
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.softDelete(String(req.params.id), req.user);
      res.status(200).json({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const progressController = new ProgressController();
