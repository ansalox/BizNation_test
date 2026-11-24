import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { PARANOID_MODEL_OPTIONS, sequelize } from '../../database';
import type { User } from '../users/user.model';
import type { Course } from '../courses/course.model';
import type { Lesson } from '../lessons/lesson.model';

export class LessonProgress extends Model<
  InferAttributes<LessonProgress>,
  InferCreationAttributes<LessonProgress>
> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<string>;
  declare course_id: ForeignKey<string>;
  declare lesson_id: ForeignKey<string>;
  declare completed: CreationOptional<boolean>;
  declare completed_at: CreationOptional<Date | null>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare readonly deleted_at: CreationOptional<Date | null>;

  declare user?: NonAttribute<User>;
  declare course?: NonAttribute<Course>;
  declare lesson?: NonAttribute<Lesson>;
}

LessonProgress.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'lesson_progress',
    modelName: 'LessonProgress',
    ...PARANOID_MODEL_OPTIONS,
  },
);
