import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../middlewares/errorHandler';
import { parseWithSchema } from '../../utils/validation';
import { WebhookService, webhookService } from './webhook.service';

const listEventsQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).default(1),
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100).default(20),
  ),
  status: z.enum(['received', 'processed', 'failed']).optional(),
  provider: z.string().trim().max(100).optional(),
});

function readQueryParam(query: Request['query'], dottedKey: string, nestedKey: string): string | undefined {
  const flat = query[dottedKey];
  if (typeof flat === 'string') {
    return flat;
  }
  const nestedObj = query.hub;
  if (typeof nestedObj === 'object' && nestedObj !== null && !Array.isArray(nestedObj)) {
    const nested = (nestedObj as Record<string, unknown>)[nestedKey];
    if (typeof nested === 'string') {
      return nested;
    }
  }
  return undefined;
}

export class WebhookController {
  constructor(private readonly service: WebhookService = webhookService) {}

  verifyWhatsApp = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const challenge = this.service.verifyWhatsAppChallenge({
        mode: readQueryParam(req.query, 'hub.mode', 'mode'),
        verifyToken: readQueryParam(req.query, 'hub.verify_token', 'verify_token'),
        challenge: readQueryParam(req.query, 'hub.challenge', 'challenge'),
      });

      res.status(200).type('text/plain').send(challenge);
    } catch (error) {
      next(error);
    }
  };

  receiveWhatsApp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        throw new AppError('Webhook payload must be a JSON object', 400, 'VALIDATION_ERROR');
      }

      const result = await this.service.processWhatsAppEvent(
        req.body as Record<string, unknown>,
      );

      res.status(200).json({
        success: true,
        duplicate: result.duplicate,
        message: result.message,
        data: result.event,
        ...(result.alert ? { alert: result.alert } : {}),
      });
    } catch (error) {
      next(error);
    }
  };

  listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseWithSchema(listEventsQuerySchema, req.query);
      const result = await this.service.listEvents(parsed);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const webhookController = new WebhookController();
