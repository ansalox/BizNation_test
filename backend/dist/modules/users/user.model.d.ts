import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
export type UserRole = 'admin' | 'student';
export interface SafeUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    classification: string | null;
    last_activity_at: Date | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export declare class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    id: CreationOptional<string>;
    name: string;
    email: string;
    password_hash: string;
    role: CreationOptional<UserRole>;
    classification: CreationOptional<string | null>;
    last_activity_at: CreationOptional<Date | null>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
    toSafeJSON(): SafeUser;
    toJSON(): Record<string, unknown>;
}
