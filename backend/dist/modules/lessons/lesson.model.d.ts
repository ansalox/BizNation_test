import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import type { Course } from '../courses/course.model';
export declare class Lesson extends Model<InferAttributes<Lesson>, InferCreationAttributes<Lesson>> {
    id: CreationOptional<string>;
    course_id: ForeignKey<string>;
    title: string;
    content: CreationOptional<string>;
    order_index: CreationOptional<number>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
    course?: NonAttribute<Course>;
}
