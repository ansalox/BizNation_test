import { LessonProgress } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
export interface ProgressFilter {
    userId?: string;
    courseId?: string;
}
export interface UpsertProgressInput {
    user_id?: string;
    course_id: string;
    lesson_id: string;
    completed?: boolean;
}
export interface UpdateProgressInput {
    completed: boolean;
}
export declare class ProgressService {
    private ensureOwnershipOrAdmin;
    findAll(filters: ProgressFilter, actor?: AuthenticatedUser): Promise<LessonProgress[]>;
    findById(id: string, actor?: AuthenticatedUser): Promise<LessonProgress>;
    recordProgress(input: UpsertProgressInput, actor: AuthenticatedUser): Promise<{
        progress: LessonProgress;
        created: boolean;
    }>;
    update(id: string, input: UpdateProgressInput, actor?: AuthenticatedUser): Promise<LessonProgress>;
    softDelete(id: string, actor?: AuthenticatedUser): Promise<void>;
}
export declare const progressService: ProgressService;
