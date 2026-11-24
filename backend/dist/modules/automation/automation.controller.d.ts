import { NextFunction, Request, Response } from 'express';
import { AutomationService } from './automation.service';
export declare class AutomationController {
    private readonly service;
    constructor(service?: AutomationService);
    getStudentsReport: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    listAlerts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateAlertStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const automationController: AutomationController;
