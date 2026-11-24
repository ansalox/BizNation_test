import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { HealthService } from '../src/modules/health/health.service';
import { HealthController } from '../src/modules/health/health.controller';
import * as databaseModule from '../src/database';

describe('Health Module Layered Architecture (Unit Tests)', () => {
  describe('HealthService', () => {
    it('returns liveness metadata with service name and uptime', () => {
      const service = new HealthService();
      const result = service.getLiveness();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('biznation-backend');
      expect(result.environment).toBe('test');
      expect(typeof result.uptimeSeconds).toBe('number');
    });

    it('returns readiness status including database health check', async () => {
      vi.spyOn(databaseModule, 'checkDatabaseConnection').mockResolvedValueOnce({
        status: 'up',
        latencyMs: 3,
      });

      const service = new HealthService();
      const result = await service.getReadiness();

      expect(result.status).toBe('ok');
      expect(result.database).toEqual({ status: 'up', latencyMs: 3 });
    });
  });

  describe('HealthController', () => {
    it('responds with 200 and delegates liveness to HealthService', () => {
      const mockService = {
        getLiveness: vi.fn().mockReturnValue({
          status: 'ok',
          service: 'biznation-backend',
          environment: 'test',
          timestamp: '2026-11-24T00:00:00.000Z',
          uptimeSeconds: 10,
        }),
        getReadiness: vi.fn(),
      } as unknown as HealthService;

      const controller = new HealthController(mockService);
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const res = { status } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      controller.getHealth({} as Request, res, next);

      expect(mockService.getLiveness).toHaveBeenCalledTimes(1);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ status: 'ok' }),
      });
    });
  });
});
