import { NextFunction, Request, Response } from 'express';
import { CourseService } from './course.service';
export declare class CourseController {
    private readonly service;
    constructor(service?: CourseService);
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const courseController: CourseController;
