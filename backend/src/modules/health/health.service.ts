import { checkDatabaseConnection, DatabaseHealth } from '../../database';
import { env } from '../../config/env';

export interface LivenessStatus {
  status: 'ok';
  service: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessStatus extends LivenessStatus {
  database: DatabaseHealth;
}

export class HealthService {
  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      service: 'biznation-backend',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const database = await checkDatabaseConnection();
    return {
      ...this.getLiveness(),
      database,
    };
  }
}

export const healthService = new HealthService();
