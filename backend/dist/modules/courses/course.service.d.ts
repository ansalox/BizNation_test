import { Course } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
export interface CreateCourseInput {
    title: string;
    description?: string;
    is_published?: boolean;
}
export interface UpdateCourseInput {
    title?: string;
    description?: string;
    is_published?: boolean;
}
export interface CourseListQuery {
    page?: number;
    limit?: number;
    title?: string;
    startDate?: Date;
    endDate?: Date;
    minProgress?: number;
    maxProgress?: number;
    onlyPublished?: boolean;
}
export interface AdminCourseMetrics {
    totalStudentsWithProgress: number;
    averageProgressPercentage: number;
}
export interface CourseResponse {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    lessons: unknown[];
    totalLessons: number;
    completedLessons?: number;
    progressPercentage?: number;
    metrics?: AdminCourseMetrics;
}
export interface PaginatedCoursesResult {
    data: CourseResponse[];
    total: number;
    page: number;
    totalPages: number;
}
export declare class CourseService {
    private buildWhereClause;
    private enrichCoursesWithProgress;
    findAll(actor?: AuthenticatedUser, query?: CourseListQuery): Promise<PaginatedCoursesResult>;
    findById(id: string, actor?: AuthenticatedUser): Promise<CourseResponse>;
    create(input: CreateCourseInput): Promise<Course>;
    update(id: string, input: UpdateCourseInput): Promise<Course>;
    softDelete(id: string): Promise<void>;
}
export declare const courseService: CourseService;
