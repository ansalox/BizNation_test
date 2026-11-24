import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { Lesson, LessonProgress, SupportAlert, User, WebhookEvent } from '../src/database/models';
import { AutomationService } from '../src/modules/automation/automation.service';

const ADMIN_TOKEN = jwt.sign(
  { sub: '10000000-0000-4000-8000-000000000001', email: 'admin@biznation.com', role: 'admin' },
  env.jwt.secret,
);
const STUDENT_TOKEN = jwt.sign(
  { sub: '10000000-0000-4000-8000-000000000002', email: 'student@biznation.com', role: 'student' },
  env.jwt.secret,
);

describe('AutomationService (Scoring, Classification & Keyword AI)', () => {
  const service = new AutomationService();
  const fixedNow = new Date('2026-11-24T12:00:00.000Z');
  const daysAgo = (days: number) => new Date(fixedNow.getTime() - days * 24 * 60 * 60 * 1000);

  describe('calculateRecencyScore()', () => {
    it('returns expected recency brackets across all day intervals', () => {
      expect(service.calculateRecencyScore(daysAgo(0), fixedNow)).toEqual({
        recencyScore: 100,
        daysSinceLastActivity: 0,
      });
      expect(service.calculateRecencyScore(daysAgo(3), fixedNow)).toEqual({
        recencyScore: 100,
        daysSinceLastActivity: 3,
      });
      expect(service.calculateRecencyScore(daysAgo(7), fixedNow)).toEqual({
        recencyScore: 80,
        daysSinceLastActivity: 7,
      });
      expect(service.calculateRecencyScore(daysAgo(14), fixedNow)).toEqual({
        recencyScore: 50,
        daysSinceLastActivity: 14,
      });
      expect(service.calculateRecencyScore(daysAgo(30), fixedNow)).toEqual({
        recencyScore: 20,
        daysSinceLastActivity: 30,
      });
      expect(service.calculateRecencyScore(daysAgo(45), fixedNow)).toEqual({
        recencyScore: 0,
        daysSinceLastActivity: 45,
      });
      expect(service.calculateRecencyScore(null, fixedNow)).toEqual({
        recencyScore: 0,
        daysSinceLastActivity: null,
      });
    });
  });

  describe('calculateStudentScore() & classifyScore()', () => {
    it('classifies Alto desempeño for scores 80-100', () => {
      const result = service.calculateStudentScore({
        completionPercentage: 90,
        lastActivityAt: daysAgo(1),
        now: fixedNow,
      });

      expect(result.score).toBe(94); // 90*0.6 + 100*0.4
      expect(result.classification).toBe('Alto desempeño');
      expect(service.classifyScore(80)).toBe('Alto desempeño');
      expect(service.classifyScore(100)).toBe('Alto desempeño');
    });

    it('classifies En progreso for scores 50-79', () => {
      const result = service.calculateStudentScore({
        completionPercentage: 50,
        lastActivityAt: daysAgo(5),
        now: fixedNow,
      });

      expect(result.score).toBe(62); // 50*0.6 + 80*0.4
      expect(result.classification).toBe('En progreso');
      expect(service.classifyScore(50)).toBe('En progreso');
      expect(service.classifyScore(79)).toBe('En progreso');
    });

    it('classifies En riesgo for scores 25-49', () => {
      const result = service.calculateStudentScore({
        completionPercentage: 30,
        lastActivityAt: daysAgo(20),
        now: fixedNow,
      });

      expect(result.score).toBe(26); // 30*0.6 + 20*0.4
      expect(result.classification).toBe('En riesgo');
      expect(service.classifyScore(25)).toBe('En riesgo');
      expect(service.classifyScore(49)).toBe('En riesgo');
    });

    it('classifies Inactivo for scores 0-24', () => {
      const neverActive = service.calculateStudentScore({
        completionPercentage: 0,
        lastActivityAt: null,
        now: fixedNow,
      });
      expect(neverActive.score).toBe(0);
      expect(neverActive.classification).toBe('Inactivo');

      const staleLowCompletion = service.calculateStudentScore({
        completionPercentage: 20,
        lastActivityAt: daysAgo(45),
        now: fixedNow,
      });
      expect(staleLowCompletion.score).toBe(12); // 20*0.6 + 0*0.4
      expect(staleLowCompletion.classification).toBe('Inactivo');
      expect(service.classifyScore(24)).toBe('Inactivo');
    });
  });

  describe('evaluateAndClassifyStudent() & getStudentsReport()', () => {
    it('evaluates student progress and updates users.classification in Sequelize', async () => {
      const mockStudent = {
        id: '10000000-0000-4000-8000-000000000002',
        role: 'student',
        classification: 'Inactivo',
        last_activity_at: new Date(),
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as User;

      vi.spyOn(User, 'findByPk').mockResolvedValueOnce(mockStudent);
      vi.spyOn(Lesson, 'count').mockResolvedValueOnce(4);
      vi.spyOn(LessonProgress, 'findAll').mockResolvedValueOnce([
        { lesson_id: 'l1' },
        { lesson_id: 'l2' },
        { lesson_id: 'l3' },
        { lesson_id: 'l4' },
      ] as LessonProgress[]);

      const result = await service.evaluateAndClassifyStudent(mockStudent.id);

      expect(result).toMatchObject({
        score: 100,
        completionPercentage: 100,
        classification: 'Alto desempeño',
      });
      expect(mockStudent.update).toHaveBeenCalledWith({
        classification: 'Alto desempeño',
      });
    });

    it('generates students report with classification summary for admin', async () => {
      const s1 = {
        id: 'u1',
        name: 'Laura Gómez',
        email: 'laura@biznation.com',
        role: 'student',
        classification: null,
        last_activity_at: new Date(),
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as User;
      const s2 = {
        id: 'u2',
        name: 'Carlos Mendoza',
        email: 'carlos@biznation.com',
        role: 'student',
        classification: null,
        last_activity_at: null,
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as User;

      vi.spyOn(User, 'findAll').mockResolvedValueOnce([s1, s2]);
      vi.spyOn(Lesson, 'count').mockResolvedValueOnce(2);
      vi.spyOn(LessonProgress, 'findAll').mockResolvedValueOnce([
        { user_id: 'u1', lesson_id: 'l1' },
        { user_id: 'u1', lesson_id: 'l2' },
      ] as LessonProgress[]);

      const report = await service.getStudentsReport();

      expect(report.summary).toEqual({
        totalStudents: 2,
        averageScore: 50,
        byClassification: {
          'Alto desempeño': 1,
          'En progreso': 0,
          'En riesgo': 0,
          Inactivo: 1,
        },
      });
      expect(report.data[0].classification).toBe('Alto desempeño');
      expect(report.data[1].classification).toBe('Inactivo');
    });
  });

  describe('analyzeMessage() - Keyword Intent & Sentiment Detection', () => {
    it('detects high priority support alert for "no entiendo", "error", "ayuda", "problema"', () => {
      const case1 = service.analyzeMessage('No entiendo este módulo y me sale un error');
      expect(case1.priority).toBe('high');
      expect(case1.sentiment).toBe('negative');
      expect(case1.requiresAttention).toBe(true);
      expect(case1.matchedKeywords).toEqual(expect.arrayContaining(['no entiendo', 'error']));

      const case2 = service.analyzeMessage('Necesito ayuda urgente, tengo un problema con el pago');
      expect(case2.priority).toBe('high');
      expect(case2.sentiment).toBe('negative');
      expect(case2.requiresAttention).toBe(true);
      expect(case2.matchedKeywords).toEqual(
        expect.arrayContaining(['ayuda', 'problema', 'urgente']),
      );
    });

    it('detects medium priority support alert for mild keywords like "duda"', () => {
      const result = service.analyzeMessage('Hola, tengo una duda sobre el ejercicio');

      expect(result.priority).toBe('medium');
      expect(result.intent).toBe('support_request');
      expect(result.requiresAttention).toBe(true);
      expect(result.matchedKeywords).toContain('duda');
    });

    it('detects positive sentiment for "gracias" and "excelente" even with accents/uppercase', () => {
      const result = service.analyzeMessage('¡Muchas GRACIAS! Excelente explicación del curso');

      expect(result.sentiment).toBe('positive');
      expect(result.priority).toBe('low');
      expect(result.requiresAttention).toBe(false);
      expect(result.matchedKeywords).toEqual(expect.arrayContaining(['excelente', 'gracias']));
    });

    it('returns neutral low priority when no keywords match', () => {
      const result = service.analyzeMessage('Confirmo recepción del horario semanal');

      expect(result).toEqual({
        intent: 'general_inquiry',
        sentiment: 'neutral',
        priority: 'low',
        score: 0,
        matchedKeywords: [],
        requiresAttention: false,
      });
    });

    it('analyzes Meta WhatsApp nested message and persists SupportAlert', async () => {
      const createAlertSpy = vi
        .spyOn(SupportAlert, 'create')
        .mockImplementation(async (values) => values as unknown as SupportAlert);

      const mockEvent = {
        id: '50000000-0000-4000-8000-000000000050',
        external_event_id: 'wamid_alert_01',
      } as WebhookEvent;

      await service.analyzeAndRecordWebhookAlert(mockEvent, {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+573001112233',
                      text: { body: 'Ayuda por favor, no entiendo el error en la clase 2' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      expect(createAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_event_id: mockEvent.id,
          external_event_id: 'wamid_alert_01',
          sender: '+573001112233',
          priority: 'high',
          sentiment: 'negative',
          requires_attention: true,
        }),
      );
    });
  });

  describe('Automation HTTP Endpoints (/api/automation/*)', () => {
    it('enforces admin RBAC on /api/automation/students-report and /api/automation/alerts', async () => {
      const noAuth = await request(app).get('/api/automation/students-report');
      expect(noAuth.status).toBe(401);

      const studentRes = await request(app)
        .get('/api/automation/students-report')
        .set('Authorization', `Bearer ${STUDENT_TOKEN}`);
      expect(studentRes.status).toBe(403);

      vi.spyOn(User, 'findAll').mockResolvedValueOnce([]);
      vi.spyOn(Lesson, 'count').mockResolvedValueOnce(0);
      const adminReportRes = await request(app)
        .get('/api/automation/students-report')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      expect(adminReportRes.status).toBe(200);
      expect(adminReportRes.body.success).toBe(true);

      vi.spyOn(SupportAlert, 'findAndCountAll').mockResolvedValueOnce({
        rows: [],
        count: 0,
      } as never);
      const adminAlertsRes = await request(app)
        .get('/api/automation/alerts')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      expect(adminAlertsRes.status).toBe(200);
      expect(adminAlertsRes.body.total).toBe(0);
    });
  });
});
