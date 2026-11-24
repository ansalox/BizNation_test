import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { parseUuid, parseWithSchema } from '../utils/validation';

export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = parseWithSchema(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateUuidParam(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      parseUuid(req.params[paramName], paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}
