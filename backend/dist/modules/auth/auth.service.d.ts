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
export declare class AuthService {
    private signToken;
    register(input: RegisterInput): Promise<AuthResult>;
    login(input: LoginInput): Promise<AuthResult>;
    getProfile(userId: string): Promise<SafeUser>;
}
export declare const authService: AuthService;
