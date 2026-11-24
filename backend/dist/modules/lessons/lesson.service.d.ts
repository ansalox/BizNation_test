import { Lesson } from '../../database/models';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
export interface CreateLessonInput {
    course_id: string;
    title: string;
    content?: string;
    order_index?: number;
}
export interface UpdateLessonInput {
    course_id?: string;
    title?: string;
    content?: string;
    order_index?: number;
}
export declare class LessonService {
    findAll(courseId?: string, actor?: AuthenticatedUser): Promise<Lesson[]>;
    findById(id: string, actor?: AuthenticatedUser): Promise<Lesson>;
    create(input: CreateLessonInput): Promise<Lesson>;
    update(id: string, input: UpdateLessonInput): Promise<Lesson>;
    softDelete(id: string): Promise<void>;
}
export declare const lessonService: LessonService;
