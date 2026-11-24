import { NextFunction, Request, Response } from 'express';
import { UserService } from './user.service';
export declare class UserController {
    private readonly service;
    constructor(service?: UserService);
    list: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const userController: UserController;
