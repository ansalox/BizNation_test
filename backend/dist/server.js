"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./database");
let server;
async function bootstrap() {
    if (env_1.env.nodeEnv === 'production' && !env_1.env.jwt.secret) {
        throw new Error('JWT_SECRET environment variable must be configured in production.');
    }
    const dbHealth = await (0, database_1.checkDatabaseConnection)();
    if (dbHealth.status === 'up') {
        console.info(`[DB] Connected to PostgreSQL (${dbHealth.latencyMs}ms)`);
    }
    else {
        console.warn(`[DB] PostgreSQL connection unavailable at startup: ${dbHealth.error}`);
    }
    server = app_1.app.listen(env_1.env.port, () => {
        console.info(`[Server] Running in ${env_1.env.nodeEnv} mode on port ${env_1.env.port}`);
        console.info(`[Swagger] Docs available at http://localhost:${env_1.env.port}/api/docs`);
    });
}
async function shutdown(signal) {
    console.info(`[Server] ${signal} received. Starting graceful shutdown...`);
    if (server) {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }
    await (0, database_1.closeDatabaseConnection)();
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
//# sourceMappingURL=server.js.map