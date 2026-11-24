import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { parseWithSchema } from '../../utils/validation';
import { AutomationService, automationService } from './automation.service';
import type { AlertStatus } from './supportAlert.model';

const listAlertsQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).default(1),
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100).default(20),
  ),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  status: z.enum(['open', 'reviewed', 'resolved']).optional(),
});

export class AutomationController {
  constructor(private readonly service: AutomationService = automationService) {}

  getStudentsReport = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const report = await this.service.getStudentsReport();
      res.status(200).json({
        success: true,
        data: report.data,
        summary: report.summary,
      });
    } catch (error) {
      next(error);
    }
  };

  listAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = parseWithSchema(listAlertsQuerySchema, req.query);
      const result = await this.service.listAlerts(query);
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

  updateAlertStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.body as { status: AlertStatus };
      const alert = await this.service.updateAlertStatus(String(req.params.id), status);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const automationController = new AutomationController();
