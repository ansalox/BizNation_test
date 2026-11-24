import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { User } from '../../database/models';
import { AppError } from '../../middlewares/errorHandler';
import type { SafeUser } from '../users/user.model';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  classification?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export class AuthService {
  private signToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    });
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const user = await User.create({
      name: input.name.trim(),
      email,
      password_hash: passwordHash,
      role: 'student',
      classification: input.classification ?? null,
      last_activity_at: new Date(),
    });

    const token = this.signToken(user);
    return {
      user: user.toSafeJSON(),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    await user.update({ last_activity_at: new Date() });

    const token = this.signToken(user);
    return {
      user: user.toSafeJSON(),
      token,
    };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user.toSafeJSON();
  }
}

export const authService = new AuthService();
