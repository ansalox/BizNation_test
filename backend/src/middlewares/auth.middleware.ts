import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../modules/users/user.model';
import { AppError } from './errorHandler';

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

function isValidRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'student';
}

export function authenticateJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.email !== 'string' ||
      !isValidRole(decoded.role)
    ) {
      next(new AppError('Invalid authentication token payload', 401, 'INVALID_TOKEN'));
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
  }
}

export function requireRole(...allowedRoles: Array<UserRole | UserRole[]>) {
  const normalizedRoles = allowedRoles.flat();

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication is required', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!normalizedRoles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions to access this resource', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}
