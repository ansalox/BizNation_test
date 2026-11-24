import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';

export const uuidSchema = z.uuid('Invalid UUID identifier');

export function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
  return result.data;
}

export function parseUuid(value: unknown, fieldName = 'id'): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    throw new AppError(`Invalid UUID for parameter '${fieldName}'`, 400, 'VALIDATION_ERROR', [
      { path: fieldName, message: result.error.issues[0]?.message ?? 'Invalid UUID' },
    ]);
  }
  return result.data;
}
