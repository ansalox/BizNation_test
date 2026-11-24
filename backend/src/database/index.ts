import { Options, Sequelize } from 'sequelize';
import { env } from '../config/env';

/**
 * Default Sequelize model options enforced across the project.
 * Guarantees soft deletes (`paranoid: true`) and snake_case timestamps.
 */
export const PARANOID_MODEL_OPTIONS = {
  timestamps: true,
  paranoid: true,
  underscored: true,
} as const;

const dialectOptions: Options['dialectOptions'] = env.db.ssl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: env.db.sslRejectUnauthorized,
      },
    }
  : {};

const sharedOptions: Options = {
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? (sql: string) => console.debug(sql) : false,
  dialectOptions,
  pool: env.db.pool,
  define: {
    ...PARANOID_MODEL_OPTIONS,
  },
};

export const sequelize = env.db.url
  ? new Sequelize(env.db.url, sharedOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      ...sharedOptions,
    });

export interface DatabaseHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const start = Date.now();
  try {
    await sequelize.authenticate();
    return {
      status: 'up',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await sequelize.close();
}
