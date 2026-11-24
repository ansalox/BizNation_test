import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
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
export declare class UserService {
    findAll(): Promise<SafeUser[]>;
    findById(id: string, actor?: AuthenticatedUser): Promise<SafeUser>;
    create(input: CreateUserInput): Promise<SafeUser>;
    update(id: string, input: UpdateUserInput, actor?: AuthenticatedUser): Promise<SafeUser>;
    softDelete(id: string): Promise<void>;
}
export declare const userService: UserService;
