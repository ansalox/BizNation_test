import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { PARANOID_MODEL_OPTIONS, sequelize } from '../src/database';
import { Course, Lesson, LessonProgress, SupportAlert, User, WebhookEvent } from '../src/database/models';

describe('Backend Infrastructure, Swagger & Sequelize Conventions', () => {
  describe('GET /health', () => {
    it('returns 200 OK with liveness payload', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'ok',
        service: 'biznation-backend',
        environment: 'test',
      });
      expect(typeof response.body.data.timestamp).toBe('string');
      expect(typeof response.body.data.uptimeSeconds).toBe('number');
    });
  });

  describe('GET /health/ready', () => {
    it('returns 200 OK when PostgreSQL connection succeeds', async () => {
      const authSpy = vi.spyOn(sequelize, 'authenticate').mockResolvedValueOnce();

      const response = await request(app).get('/health/ready');

      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.database.status).toBe('up');
    });

    it('returns 503 Service Unavailable when PostgreSQL connection fails', async () => {
      const authSpy = vi
        .spyOn(sequelize, 'authenticate')
        .mockRejectedValueOnce(new Error('Connection refused'));

      const response = await request(app).get('/health/ready');

      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.database).toEqual({
        status: 'down',
        error: 'Connection refused',
      });
    });
  });

  describe('Swagger /api/docs', () => {
    it('serves Swagger UI at /api/docs/', async () => {
      const response = await request(app).get('/api/docs/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Swagger UI');
    });

    it('exposes OpenAPI 3.0 specification with BearerAuth and all REST endpoints at /api/docs.json', async () => {
      const response = await request(app).get('/api/docs.json');

      expect(response.status).toBe(200);
      expect(response.body.openapi).toBe('3.0.3');
      expect(response.body.info.title).toBe('Biz Nation API');
      expect(response.body.components.securitySchemes).toHaveProperty('BearerAuth');
      expect(response.body.paths).toHaveProperty('/health');
      expect(response.body.paths).toHaveProperty('/api/auth/register');
      expect(response.body.paths).toHaveProperty('/api/auth/login');
      expect(response.body.paths).toHaveProperty('/api/users');
      expect(response.body.paths).toHaveProperty('/api/courses');
      expect(response.body.paths).toHaveProperty('/api/courses/{id}');
      expect(response.body.paths).toHaveProperty('/api/lessons');
      expect(response.body.paths).toHaveProperty('/api/progress');
      expect(response.body.paths).toHaveProperty('/api/webhooks/whatsapp');
      expect(response.body.paths).toHaveProperty('/api/webhooks/events');
      expect(response.body.paths).toHaveProperty('/api/automation/students-report');
      expect(response.body.paths).toHaveProperty('/api/automation/alerts');
      expect(response.body.paths['/api/webhooks/whatsapp']).toHaveProperty('get');
      expect(response.body.paths['/api/webhooks/whatsapp']).toHaveProperty('post');

      const coursesGetParams = response.body.paths['/api/courses'].get.parameters.map(
        (p: { name: string }) => p.name,
      );
      expect(coursesGetParams).toEqual(
        expect.arrayContaining([
          'page',
          'limit',
          'title',
          'startDate',
          'endDate',
          'minProgress',
          'maxProgress',
        ]),
      );
      expect(response.body.paths['/api/courses/{id}'].delete.responses).toHaveProperty('409');
    });
  });

  describe('GET /api', () => {
    it('returns API metadata', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          name: 'Biz Nation API',
          version: '1.0.0',
          docs: '/api/docs',
          health: '/health',
        },
      });
    });
  });

  describe('404 Not Found Handler', () => {
    it('returns standardized 404 JSON error for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route GET /api/unknown-endpoint not found',
        },
      });
    });
  });

  describe('Sequelize Soft Delete (paranoid: true) Enforcement', () => {
    it('enforces paranoid soft-delete globally and across User, Course, Lesson, and LessonProgress models', () => {
      expect(PARANOID_MODEL_OPTIONS).toEqual({
        timestamps: true,
        paranoid: true,
        underscored: true,
      });
      expect(sequelize.options.define).toMatchObject({
        timestamps: true,
        paranoid: true,
        underscored: true,
      });

      for (const model of [User, Course, Lesson, LessonProgress, WebhookEvent, SupportAlert]) {
        expect(model.options.paranoid).toBe(true);
        expect(model.options.timestamps).toBe(true);
        expect(model.options.underscored).toBe(true);
      }
    });
  });
});
