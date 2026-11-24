import { NextFunction, Request, Response } from 'express';
import { HealthService } from './health.service';
export declare class HealthController {
    private readonly service;
    constructor(service?: HealthService);
    getHealth: (_req: Request, res: Response, next: NextFunction) => void;
    getReadiness: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const healthController: HealthController;
