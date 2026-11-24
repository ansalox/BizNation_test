import { NextFunction, Request, Response } from 'express';
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function sendErrorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendErrorResponse(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => ({ field: e.path, message: e.message }));
    sendErrorResponse(res, 409, 'CONFLICT', 'Resource already exists', fields);
    return;
  }

  if (err instanceof ValidationError) {
    const issues = err.errors.map((e) => ({ field: e.path, message: e.message }));
    sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Database validation failed', issues);
    return;
  }

  if (err instanceof ForeignKeyConstraintError) {
    sendErrorResponse(res, 400, 'FOREIGN_KEY_ERROR', 'Referenced resource does not exist');
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    sendErrorResponse(res, 400, 'INVALID_JSON', 'Malformed JSON request body');
    return;
  }

  const isDev = env.nodeEnv === 'development';
  if (env.nodeEnv !== 'test') {
    console.error('[UnhandledError]', err);
  }

  sendErrorResponse(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    isDev ? err.message : 'An unexpected internal error occurred',
    isDev ? { stack: err.stack } : undefined,
  );
}
