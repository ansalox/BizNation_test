import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { WebhookEvent } from '../src/database/models';
import { AppError } from '../src/middlewares/errorHandler';
import {
  computeHmacSignature,
  RequestWithRawBody,
  verifyWebhookSignature,
} from '../src/middlewares/webhookSignature.middleware';

describe('Webhook HMAC-SHA256 Middleware & Endpoints', () => {
  describe('verifyWebhookSignature (Unit)', () => {
    it('calls next() with no error when x-hub-signature-256 is valid', () => {
      const payload = { external_event_id: 'evt_1', event_type: 'message.received' };
      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = computeHmacSignature(rawBody, env.webhook.secret);

      const req = {
        headers: { 'x-hub-signature-256': signature },
        body: payload,
        rawBody,
      } as unknown as RequestWithRawBody;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      verifyWebhookSignature(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('passes 401 AppError when x-hub-signature-256 header is missing', () => {
      const req = {
        headers: {},
        body: { external_event_id: 'evt_1' },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      verifyWebhookSignature(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('passes 401 AppError when x-hub-signature-256 is invalid or tampered', () => {
      const rawBody = Buffer.from(JSON.stringify({ external_event_id: 'evt_1' }), 'utf8');
      const wrongSignature = computeHmacSignature(rawBody, 'wrong-webhook-secret');

      const req = {
        headers: { 'x-hub-signature-256': wrongSignature },
        rawBody,
      } as unknown as RequestWithRawBody;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      verifyWebhookSignature(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('passes 401 AppError when signature has invalid length without throwing RangeError', () => {
      const rawBody = Buffer.from('{"external_event_id":"evt_1"}', 'utf8');
      const req = {
        headers: { 'x-hub-signature-256': 'sha256=short' },
        rawBody,
      } as unknown as RequestWithRawBody;
      const res = {} as Response;
      const next = vi.fn() as unknown as NextFunction;

      verifyWebhookSignature(req, res, next);

      const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });
  });

  describe('Webhook HTTP Endpoints (Supertest)', () => {
    it('GET /api/webhooks/whatsapp echoes hub.challenge when hub.verify_token matches', async () => {
      const res = await request(app).get(
        `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(env.webhook.verifyToken)}&hub.challenge=challenge_12345`,
      );

      expect(res.status).toBe(200);
      expect(res.text).toBe('challenge_12345');
    });

    it('GET /api/webhooks/whatsapp returns 403 when hub.verify_token is invalid', async () => {
      const res = await request(app).get(
        '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge_12345',
      );

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('WEBHOOK_VERIFICATION_FAILED');
    });

    it('POST /api/webhooks/whatsapp returns 401 when HMAC signature is missing or invalid', async () => {
      const body = { external_event_id: 'evt_http_1', event_type: 'message.received' };

      const noSigRes = await request(app).post('/api/webhooks/whatsapp').send(body);
      expect(noSigRes.status).toBe(401);
      expect(noSigRes.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');

      const badSigRes = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', 'sha256=deadbeef')
        .send(body);
      expect(badSigRes.status).toBe(401);
      expect(badSigRes.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('POST /api/webhooks/whatsapp accepts valid HMAC signature and responds 200 OK', async () => {
      const rawJson = JSON.stringify({
        external_event_id: 'evt_http_valid_1',
        event_type: 'message.received',
        data: { from: '+573001112233' },
      });
      const signature = computeHmacSignature(rawJson, env.webhook.secret);

      const mockEvent = {
        id: '50000000-0000-4000-8000-000000000001',
        external_event_id: 'evt_http_valid_1',
        provider: 'whatsapp_meta',
        event_type: 'message.received',
        status: 'received',
        attempts: 1,
        update: vi.fn().mockImplementation(async function (this: Record<string, unknown>, patch) {
          Object.assign(this, patch);
          return this;
        }),
      } as unknown as WebhookEvent;

      vi.spyOn(WebhookEvent, 'findOne').mockResolvedValueOnce(null);
      vi.spyOn(WebhookEvent, 'create').mockResolvedValueOnce(mockEvent);

      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(rawJson);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.duplicate).toBe(false);
    });

    it('GET /api/webhooks/events allows admin and blocks unauthenticated or student requests', async () => {
      const noAuth = await request(app).get('/api/webhooks/events');
      expect(noAuth.status).toBe(401);

      const studentToken = jwt.sign(
        { sub: '10000000-0000-4000-8000-000000000002', email: 's@b.com', role: 'student' },
        env.jwt.secret,
      );
      const studentRes = await request(app)
        .get('/api/webhooks/events')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentRes.status).toBe(403);

      const adminToken = jwt.sign(
        { sub: '10000000-0000-4000-8000-000000000001', email: 'a@b.com', role: 'admin' },
        env.jwt.secret,
      );
      vi.spyOn(WebhookEvent, 'findAndCountAll').mockResolvedValueOnce({
        rows: [],
        count: 0,
      } as never);
      const adminRes = await request(app)
        .get('/api/webhooks/events')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body).toEqual({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    });
  });
});
