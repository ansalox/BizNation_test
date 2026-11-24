import { DatabaseHealth } from '../../database';
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
export declare class HealthService {
    getLiveness(): LivenessStatus;
    getReadiness(): Promise<ReadinessStatus>;
}
export declare const healthService: HealthService;
