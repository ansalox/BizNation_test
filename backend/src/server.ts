import http from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './database';

let server: http.Server | undefined;

async function bootstrap(): Promise<void> {
  if (env.nodeEnv === 'production' && !env.jwt.secret) {
    throw new Error('JWT_SECRET environment variable must be configured in production.');
  }

  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status === 'up') {
    console.info(`[DB] Connected to PostgreSQL (${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`[DB] PostgreSQL connection unavailable at startup: ${dbHealth.error}`);
  }

  server = app.listen(env.port, () => {
    console.info(`[Server] Running in ${env.nodeEnv} mode on port ${env.port}`);
    console.info(`[Swagger] Docs available at http://localhost:${env.port}/api/docs`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.info(`[Server] ${signal} received. Starting graceful shutdown...`);
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
  }
  await closeDatabaseConnection();
  console.info('[Server] Shutdown complete.');
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void bootstrap();
