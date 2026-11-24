import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../modules/users/user.model';
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}
export interface AuthTokenPayload extends JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export declare function authenticateJWT(req: Request, _res: Response, next: NextFunction): void;
export declare function requireRole(...allowedRoles: Array<UserRole | UserRole[]>): (req: Request, _res: Response, next: NextFunction) => void;
