import { NextFunction, Request, Response } from 'express';
import { ProgressService } from './progress.service';
export declare class ProgressController {
    private readonly service;
    constructor(service?: ProgressService);
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    record: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const progressController: ProgressController;
