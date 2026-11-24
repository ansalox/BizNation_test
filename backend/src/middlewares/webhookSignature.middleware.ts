import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function computeHmacSignature(payload: Buffer | string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${hmac}`;
}

export function verifyWebhookSignature(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const signatureHeader = req.headers['x-hub-signature-256'];

  if (typeof signatureHeader !== 'string' || !signatureHeader.startsWith('sha256=')) {
    next(
      new AppError(
        'Missing or malformed x-hub-signature-256 header',
        401,
        'INVALID_WEBHOOK_SIGNATURE',
      ),
    );
    return;
  }

  if (!env.webhook.secret) {
    next(
      new AppError(
        'Webhook signature verification secret is not configured',
        500,
        'WEBHOOK_SECRET_MISSING',
      ),
    );
    return;
  }

  const reqWithRaw = req as RequestWithRawBody;
  const rawPayload = reqWithRaw.rawBody
    ? reqWithRaw.rawBody
    : Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body ?? {}));

  const expectedSignature = computeHmacSignature(rawPayload, env.webhook.secret);

  const providedBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    next(new AppError('Invalid webhook HMAC signature', 401, 'INVALID_WEBHOOK_SIGNATURE'));
    return;
  }

  next();
}
