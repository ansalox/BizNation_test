import { z } from 'zod';
export declare const uuidSchema: z.ZodUUID;
export declare function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T;
export declare function parseUuid(value: unknown, fieldName?: string): string;
