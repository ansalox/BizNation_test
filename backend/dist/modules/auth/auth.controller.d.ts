import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly service;
    constructor(service?: AuthService);
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    me: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const authController: AuthController;
