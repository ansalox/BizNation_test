import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import type { User } from '../users/user.model';
import type { Course } from '../courses/course.model';
import type { Lesson } from '../lessons/lesson.model';
export declare class LessonProgress extends Model<InferAttributes<LessonProgress>, InferCreationAttributes<LessonProgress>> {
    id: CreationOptional<string>;
    user_id: ForeignKey<string>;
    course_id: ForeignKey<string>;
    lesson_id: ForeignKey<string>;
    completed: CreationOptional<boolean>;
    completed_at: CreationOptional<Date | null>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
    user?: NonAttribute<User>;
    course?: NonAttribute<Course>;
    lesson?: NonAttribute<Lesson>;
}
