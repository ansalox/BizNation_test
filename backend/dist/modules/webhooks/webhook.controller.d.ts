import { NextFunction, Request, Response } from 'express';
import { WebhookService } from './webhook.service';
export declare class WebhookController {
    private readonly service;
    constructor(service?: WebhookService);
    verifyWhatsApp: (req: Request, res: Response, next: NextFunction) => void;
    receiveWhatsApp: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listEvents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const webhookController: WebhookController;
