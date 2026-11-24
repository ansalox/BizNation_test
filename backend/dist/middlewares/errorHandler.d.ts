import { NextFunction, Request, Response } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, details?: unknown);
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
