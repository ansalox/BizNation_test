import { CreationOptional, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import type { Lesson } from '../lessons/lesson.model';
export declare class Course extends Model<InferAttributes<Course>, InferCreationAttributes<Course>> {
    id: CreationOptional<string>;
    title: string;
    description: CreationOptional<string>;
    is_published: CreationOptional<boolean>;
    readonly created_at: CreationOptional<Date>;
    readonly updated_at: CreationOptional<Date>;
    readonly deleted_at: CreationOptional<Date | null>;
    lessons?: NonAttribute<Lesson[]>;
}
