import { NextFunction, Request, Response } from 'express';
import { parseUuid } from '../../utils/validation';
import {
  CreateLessonInput,
  LessonService,
  lessonService,
  UpdateLessonInput,
} from './lesson.service';

export class LessonController {
  constructor(private readonly service: LessonService = lessonService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId =
        typeof req.query.courseId === 'string' && req.query.courseId.length > 0
          ? parseUuid(req.query.courseId, 'courseId')
          : undefined;

      const lessons = await this.service.findAll(courseId, req.user);
      res.status(200).json({
        success: true,
        data: lessons,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await this.service.findById(String(req.params.id), req.user);
      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await this.service.create(req.body as CreateLessonInput);
      res.status(201).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lesson = await this.service.update(
        String(req.params.id),
        req.body as UpdateLessonInput,
      );
      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.softDelete(String(req.params.id));
      res.status(200).json({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const lessonController = new LessonController();
