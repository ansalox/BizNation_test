const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const useSsl = process.env.DB_SSL === 'true';
const dialectOptions = useSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      },
    }
  : {};

const baseConfig = {
  username: process.env.DB_USER || 'biznation',
  password: process.env.DB_PASSWORD || 'biznation_secret',
  database: process.env.DB_NAME || 'biznation_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  dialectOptions,
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
};

module.exports = {
  development: {
    ...baseConfig,
  },
  test: {
    ...baseConfig,
    database: process.env.DB_TEST_NAME || `${baseConfig.database}_test`,
    logging: false,
  },
  production: process.env.DATABASE_URL
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions,
        define: baseConfig.define,
        migrationStorageTableName: 'sequelize_meta',
        seederStorage: 'sequelize',
        seederStorageTableName: 'sequelize_data',
        logging: false,
      }
    : {
        ...baseConfig,
        logging: false,
      },
};
