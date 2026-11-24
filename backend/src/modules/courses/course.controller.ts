import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../middlewares/errorHandler';
import { parseWithSchema } from '../../utils/validation';
import {
  CourseListQuery,
  CourseService,
  courseService,
  CreateCourseInput,
  UpdateCourseInput,
} from './course.service';

const optionalPositiveInt = (defaultValue: number, maxValue?: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce
      .number()
      .int()
      .min(1)
      .max(maxValue ?? Number.MAX_SAFE_INTEGER)
      .default(defaultValue),
  );

const optionalProgressBound = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : val),
  z.coerce.number().min(0).max(100).optional(),
);

const optionalDateString = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : val),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Must be a valid ISO date or datetime string',
    })
    .optional(),
);

const listCoursesQuerySchema = z.object({
  page: optionalPositiveInt(1),
  limit: optionalPositiveInt(10, 100),
  title: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length === 0 ? undefined : val),
    z.string().trim().max(200).optional(),
  ),
  startDate: optionalDateString,
  endDate: optionalDateString,
  minProgress: optionalProgressBound,
  maxProgress: optionalProgressBound,
  published: z.enum(['true', 'false']).optional(),
});

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDateBoundary(raw: string, boundary: 'start' | 'end'): Date {
  if (DATE_ONLY_REGEX.test(raw)) {
    return new Date(
      boundary === 'start' ? `${raw}T00:00:00.000Z` : `${raw}T23:59:59.999Z`,
    );
  }
  return new Date(raw);
}

export class CourseController {
  constructor(private readonly service: CourseService = courseService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseWithSchema(listCoursesQuerySchema, req.query);

      const startDate = parsed.startDate
        ? parseDateBoundary(parsed.startDate, 'start')
        : undefined;
      const endDate = parsed.endDate
        ? parseDateBoundary(parsed.endDate, 'end')
        : undefined;

      if (startDate && endDate && startDate > endDate) {
        throw new AppError(
          'startDate cannot be greater than endDate',
          400,
          'VALIDATION_ERROR',
        );
      }

      if (
        parsed.minProgress !== undefined &&
        parsed.maxProgress !== undefined &&
        parsed.minProgress > parsed.maxProgress
      ) {
        throw new AppError(
          'minProgress cannot be greater than maxProgress',
          400,
          'VALIDATION_ERROR',
        );
      }

      const query: CourseListQuery = {
        page: parsed.page,
        limit: parsed.limit,
        title: parsed.title,
        startDate,
        endDate,
        minProgress: parsed.minProgress,
        maxProgress: parsed.maxProgress,
        onlyPublished:
          parsed.published === 'true'
            ? true
            : parsed.published === 'false'
              ? false
              : undefined,
      };

      const result = await this.service.findAll(req.user, query);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const course = await this.service.findById(String(req.params.id), req.user);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const course = await this.service.create(req.body as CreateCourseInput);
      res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const course = await this.service.update(
        String(req.params.id),
        req.body as UpdateCourseInput,
      );
      res.status(200).json({
        success: true,
        data: course,
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

export const courseController = new CourseController();
