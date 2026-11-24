import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { User } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import type { SafeUser, UserRole } from './user.model';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  classification?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  classification?: string | null;
}

export class UserService {
  async findAll(): Promise<SafeUser[]> {
    const users = await User.findAll({
      order: [['created_at', 'DESC']],
    });
    return users.map((user) => user.toSafeJSON());
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<SafeUser> {
    if (actor && actor.role !== 'admin' && actor.id !== id) {
      throw new AppError('Insufficient permissions to view this user', 403, 'FORBIDDEN');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user.toSafeJSON();
  }

  async create(input: CreateUserInput): Promise<SafeUser> {
    const email = input.email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const user = await User.create({
      name: input.name.trim(),
      email,
      password_hash: passwordHash,
      role: input.role ?? 'student',
      classification: input.classification ?? null,
    });

    return user.toSafeJSON();
  }

  async update(id: string, input: UpdateUserInput, actor?: AuthenticatedUser): Promise<SafeUser> {
    if (actor && actor.role !== 'admin' && actor.id !== id) {
      throw new AppError('Insufficient permissions to update this user', 403, 'FORBIDDEN');
    }

    if (actor && actor.role !== 'admin' && input.role !== undefined) {
      throw new AppError('Only administrators can change user roles', 403, 'FORBIDDEN');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updates: Partial<{
      name: string;
      email: string;
      password_hash: string;
      role: UserRole;
      classification: string | null;
    }> = {};

    if (input.name !== undefined) {
      updates.name = input.name.trim();
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const duplicate = await User.findOne({ where: { email: normalizedEmail } });
        if (duplicate) {
          throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
        }
        updates.email = normalizedEmail;
      }
    }

    if (input.password !== undefined) {
      updates.password_hash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    }

    if (input.role !== undefined) {
      updates.role = input.role;
    }

    if (input.classification !== undefined) {
      updates.classification = input.classification;
    }

    await user.update(updates);
    return user.toSafeJSON();
  }

  async softDelete(id: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    await user.destroy();
  }
}

export const userService = new UserService();
