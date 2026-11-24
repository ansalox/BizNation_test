import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type NodeEnv = 'development' | 'test' | 'production';

const parseNodeEnv = (value?: string): NodeEnv => {
  if (value === 'production' || value === 'test') {
    return value;
  }
  return 'development';
};

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      (nodeEnv === 'production' ? '' : 'biznation-dev-jwt-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  webhook: {
    secret:
      process.env.WEBHOOK_SECRET ||
      (nodeEnv === 'production' ? '' : 'biznation-dev-webhook-secret'),
    verifyToken:
      process.env.WEBHOOK_VERIFY_TOKEN ||
      (nodeEnv === 'production' ? '' : 'biznation-dev-verify-token'),
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'biznation_db',
    user: process.env.DB_USER || 'biznation',
    password: process.env.DB_PASSWORD || 'biznation_secret',
    url: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true',
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 2),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
  },
} as const;
