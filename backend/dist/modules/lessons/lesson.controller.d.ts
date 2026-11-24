import { NextFunction, Request, Response } from 'express';
import { LessonService } from './lesson.service';
export declare class LessonController {
    private readonly service;
    constructor(service?: LessonService);
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const lessonController: LessonController;
