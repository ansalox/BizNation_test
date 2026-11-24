import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { PARANOID_MODEL_OPTIONS, sequelize } from '../../database';

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

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare password_hash: string;
  declare role: CreationOptional<UserRole>;
  declare classification: CreationOptional<string | null>;
  declare last_activity_at: CreationOptional<Date | null>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare readonly deleted_at: CreationOptional<Date | null>;

  toSafeJSON(): SafeUser {
    const raw = this.get({ plain: true }) as SafeUser & { password_hash?: string };
    const { password_hash: _ignored, ...safeUser } = raw;
    return safeUser;
  }

  override toJSON(): Record<string, unknown> {
    return this.toSafeJSON() as unknown as Record<string, unknown>;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'student'),
      allowNull: false,
      defaultValue: 'student',
    },
    classification: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    last_activity_at: {
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
    tableName: 'users',
    modelName: 'User',
    ...PARANOID_MODEL_OPTIONS,
  },
);
