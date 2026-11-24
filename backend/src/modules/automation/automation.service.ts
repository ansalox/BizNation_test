import { Op } from 'sequelize';
import {
  Course,
  Lesson,
  LessonProgress,
  SupportAlert,
  User,
  WebhookEvent,
} from '../../database/models';
import { AppError } from '../../middlewares/errorHandler';
import type {
  AlertPriority,
  AlertStatus,
  MessageSentiment,
} from './supportAlert.model';

export type StudentClassification =
  | 'Alto desempeño'
  | 'En progreso'
  | 'En riesgo'
  | 'Inactivo';

export interface ScoreCalculationInput {
  completionPercentage: number;
  lastActivityAt: Date | string | null;
  now?: Date;
}

export interface ScoreCalculationResult {
  score: number;
  completionPercentage: number;
  recencyScore: number;
  daysSinceLastActivity: number | null;
  classification: StudentClassification;
}

export interface StudentReportItem {
  id: string;
  name: string;
  email: string;
  classification: StudentClassification;
  score: number;
  completionPercentage: number;
  recencyScore: number;
  completedLessons: number;
  totalPublishedLessons: number;
  daysSinceLastActivity: number | null;
  last_activity_at: Date | null;
}

export interface StudentsReportResponse {
  data: StudentReportItem[];
  summary: {
    totalStudents: number;
    averageScore: number;
    byClassification: Record<StudentClassification, number>;
  };
}

export interface KeywordRule {
  keyword: string;
  weight: number;
  polarity: 'support' | 'positive';
  intent: string;
}

export interface MessageAnalysisResult {
  intent: string;
  sentiment: MessageSentiment;
  priority: AlertPriority;
  score: number;
  matchedKeywords: string[];
  requiresAttention: boolean;
}

export interface AlertsListQuery {
  page?: number;
  limit?: number;
  priority?: AlertPriority;
  sentiment?: MessageSentiment;
  status?: AlertStatus;
}

export interface PaginatedAlertsResult {
  data: SupportAlert[];
  total: number;
  page: number;
  totalPages: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const KEYWORD_RULES: readonly KeywordRule[] = [
  { keyword: 'no entiendo', weight: 45, polarity: 'support', intent: 'support_request' },
  { keyword: 'no funciona', weight: 45, polarity: 'support', intent: 'technical_issue' },
  { keyword: 'error', weight: 40, polarity: 'support', intent: 'technical_issue' },
  { keyword: 'ayuda', weight: 35, polarity: 'support', intent: 'support_request' },
  { keyword: 'problema', weight: 35, polarity: 'support', intent: 'technical_issue' },
  { keyword: 'urgente', weight: 40, polarity: 'support', intent: 'urgent_support' },
  { keyword: 'bloqueado', weight: 35, polarity: 'support', intent: 'technical_issue' },
  { keyword: 'falla', weight: 35, polarity: 'support', intent: 'technical_issue' },
  { keyword: 'duda', weight: 20, polarity: 'support', intent: 'support_request' },
  { keyword: 'soporte', weight: 25, polarity: 'support', intent: 'support_request' },
  { keyword: 'excelente', weight: 35, polarity: 'positive', intent: 'positive_feedback' },
  { keyword: 'gracias', weight: 30, polarity: 'positive', intent: 'gratitude' },
  { keyword: 'genial', weight: 30, polarity: 'positive', intent: 'positive_feedback' },
  { keyword: 'perfecto', weight: 30, polarity: 'positive', intent: 'positive_feedback' },
  { keyword: 'increible', weight: 30, polarity: 'positive', intent: 'positive_feedback' },
  { keyword: 'encanta', weight: 25, polarity: 'positive', intent: 'positive_feedback' },
];

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export class AutomationService {
  /**
   * Computes recency score (0-100) from days elapsed since `last_activity_at`.
   */
  calculateRecencyScore(
    lastActivityAt: Date | string | null,
    now: Date = new Date(),
  ): { recencyScore: number; daysSinceLastActivity: number | null } {
    if (!lastActivityAt) {
      return { recencyScore: 0, daysSinceLastActivity: null };
    }

    const parsedDate =
      lastActivityAt instanceof Date ? lastActivityAt : new Date(lastActivityAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return { recencyScore: 0, daysSinceLastActivity: null };
    }

    const diffMs = Math.max(0, now.getTime() - parsedDate.getTime());
    const days = Math.floor(diffMs / MS_PER_DAY);

    let recencyScore = 0;
    if (days <= 3) {
      recencyScore = 100;
    } else if (days <= 7) {
      recencyScore = 80;
    } else if (days <= 14) {
      recencyScore = 50;
    } else if (days <= 30) {
      recencyScore = 20;
    }

    return { recencyScore, daysSinceLastActivity: days };
  }

  /**
   * Classifies a numeric score (0-100) into Biz Nation student segments.
   */
  classifyScore(score: number): StudentClassification {
    if (score >= 80) {
      return 'Alto desempeño';
    }
    if (score >= 50) {
      return 'En progreso';
    }
    if (score >= 25) {
      return 'En riesgo';
    }
    return 'Inactivo';
  }

  /**
   * Combines lesson completion (60%) and activity recency (40%) into a 0-100 score.
   */
  calculateStudentScore(input: ScoreCalculationInput): ScoreCalculationResult {
    const clampedCompletion = Math.min(100, Math.max(0, input.completionPercentage));
    const { recencyScore, daysSinceLastActivity } = this.calculateRecencyScore(
      input.lastActivityAt,
      input.now,
    );

    const rawScore = clampedCompletion * 0.6 + recencyScore * 0.4;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));
    const classification = this.classifyScore(score);

    return {
      score,
      completionPercentage: Number(clampedCompletion.toFixed(2)),
      recencyScore,
      daysSinceLastActivity,
      classification,
    };
  }

  /**
   * Evaluates a student's progress and persists the updated `classification` on `users`.
   */
  async evaluateAndClassifyStudent(userId: string): Promise<ScoreCalculationResult | null> {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'student') {
      return null;
    }

    const totalPublishedLessons = await Lesson.count({
      include: [
        {
          model: Course,
          as: 'course',
          where: { is_published: true },
          required: true,
        },
      ],
    });

    const completedRows = await LessonProgress.findAll({
      where: {
        user_id: userId,
        completed: true,
      },
      attributes: ['lesson_id'],
    });

    const uniqueCompletedLessons = new Set(completedRows.map((row) => row.lesson_id)).size;
    const completionPercentage =
      totalPublishedLessons > 0
        ? Math.min(100, (uniqueCompletedLessons / totalPublishedLessons) * 100)
        : 0;

    const evaluation = this.calculateStudentScore({
      completionPercentage,
      lastActivityAt: user.last_activity_at,
    });

    if (user.classification !== evaluation.classification) {
      await user.update({ classification: evaluation.classification });
    }

    return evaluation;
  }

  /**
   * Generates a complete scoring & classification report for all active students (Admin only).
   */
  async getStudentsReport(): Promise<StudentsReportResponse> {
    const [students, totalPublishedLessons] = await Promise.all([
      User.findAll({
        where: { role: 'student' },
        order: [['name', 'ASC']],
      }),
      Lesson.count({
        include: [
          {
            model: Course,
            as: 'course',
            where: { is_published: true },
            required: true,
          },
        ],
      }),
    ]);

    const studentIds = students.map((student) => student.id);
    const completedByUser = new Map<string, Set<string>>();

    if (studentIds.length > 0) {
      const progressRows = await LessonProgress.findAll({
        where: {
          user_id: { [Op.in]: studentIds },
          completed: true,
        },
        attributes: ['user_id', 'lesson_id'],
      });

      for (const row of progressRows) {
        let lessonSet = completedByUser.get(row.user_id);
        if (!lessonSet) {
          lessonSet = new Set<string>();
          completedByUser.set(row.user_id, lessonSet);
        }
        lessonSet.add(row.lesson_id);
      }
    }

    const byClassification: Record<StudentClassification, number> = {
      'Alto desempeño': 0,
      'En progreso': 0,
      'En riesgo': 0,
      Inactivo: 0,
    };

    let scoreSum = 0;
    const reportItems: StudentReportItem[] = [];

    for (const student of students) {
      const completedLessons = completedByUser.get(student.id)?.size ?? 0;
      const completionPercentage =
        totalPublishedLessons > 0
          ? Math.min(100, (completedLessons / totalPublishedLessons) * 100)
          : 0;

      const evaluation = this.calculateStudentScore({
        completionPercentage,
        lastActivityAt: student.last_activity_at,
      });

      if (student.classification !== evaluation.classification) {
        await student.update({ classification: evaluation.classification });
      }

      byClassification[evaluation.classification] += 1;
      scoreSum += evaluation.score;

      reportItems.push({
        id: student.id,
        name: student.name,
        email: student.email,
        classification: evaluation.classification,
        score: evaluation.score,
        completionPercentage: evaluation.completionPercentage,
        recencyScore: evaluation.recencyScore,
        completedLessons,
        totalPublishedLessons,
        daysSinceLastActivity: evaluation.daysSinceLastActivity,
        last_activity_at: student.last_activity_at,
      });
    }

    const totalStudents = reportItems.length;
    const averageScore =
      totalStudents > 0 ? Number((scoreSum / totalStudents).toFixed(2)) : 0;

    return {
      data: reportItems,
      summary: {
        totalStudents,
        averageScore,
        byClassification,
      },
    };
  }

  /**
   * Weighted keyword & intent analyzer for incoming WhatsApp/Meta messages.
   */
  analyzeMessage(messageText: string): MessageAnalysisResult {
    const normalized = normalizeText(messageText);

    if (!normalized) {
      return {
        intent: 'general_inquiry',
        sentiment: 'neutral',
        priority: 'low',
        score: 0,
        matchedKeywords: [],
        requiresAttention: false,
      };
    }

    let supportWeight = 0;
    let positiveWeight = 0;
    let dominantRule: KeywordRule | undefined;
    const matchedKeywords: string[] = [];

    for (const rule of KEYWORD_RULES) {
      if (normalized.includes(rule.keyword)) {
        matchedKeywords.push(rule.keyword);
        if (rule.polarity === 'support') {
          supportWeight += rule.weight;
        } else {
          positiveWeight += rule.weight;
        }
        if (!dominantRule || rule.weight > dominantRule.weight) {
          dominantRule = rule;
        }
      }
    }

    let priority: AlertPriority = 'low';
    if (supportWeight >= 35) {
      priority = 'high';
    } else if (supportWeight >= 15) {
      priority = 'medium';
    }

    let sentiment: MessageSentiment = 'neutral';
    if (supportWeight > positiveWeight && supportWeight >= 20) {
      sentiment = 'negative';
    } else if (positiveWeight > supportWeight && positiveWeight >= 20) {
      sentiment = 'positive';
    }

    const requiresAttention = priority === 'high' || priority === 'medium';
    const score = supportWeight > 0 ? Math.min(100, supportWeight) : Math.min(100, positiveWeight);

    return {
      intent: dominantRule?.intent ?? 'general_inquiry',
      sentiment,
      priority,
      score,
      matchedKeywords,
      requiresAttention,
    };
  }

  extractWebhookMessageContent(payload: Record<string, unknown>): {
    messageText?: string;
    sender?: string;
  } {
    const dataObj =
      typeof payload.data === 'object' && payload.data !== null
        ? (payload.data as Record<string, unknown>)
        : undefined;

    const entries = Array.isArray(payload.entry)
      ? (payload.entry as Array<{
          changes?: Array<{
            value?: {
              messages?: Array<{
                from?: unknown;
                text?: { body?: unknown };
              }>;
            };
          }>;
        }>)
      : [];

    const firstMetaMessage = entries[0]?.changes?.[0]?.value?.messages?.[0];

    const messageText =
      asNonEmptyString(payload.message) ??
      asNonEmptyString(payload.text) ??
      asNonEmptyString(dataObj?.text) ??
      asNonEmptyString(dataObj?.body) ??
      asNonEmptyString(dataObj?.message) ??
      asNonEmptyString(firstMetaMessage?.text?.body);

    const sender =
      asNonEmptyString(payload.sender) ??
      asNonEmptyString(payload.from) ??
      asNonEmptyString(dataObj?.from) ??
      asNonEmptyString(firstMetaMessage?.from);

    return { messageText, sender };
  }

  async analyzeAndRecordWebhookAlert(
    webhookEvent: WebhookEvent,
    rawPayload: Record<string, unknown>,
  ): Promise<SupportAlert | null> {
    const { messageText, sender } = this.extractWebhookMessageContent(rawPayload);
    if (!messageText) {
      return null;
    }

    const analysis = this.analyzeMessage(messageText);

    return SupportAlert.create({
      webhook_event_id: webhookEvent.id,
      external_event_id: webhookEvent.external_event_id,
      sender: sender ?? null,
      message_text: messageText,
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      priority: analysis.priority,
      score: analysis.score,
      matched_keywords: analysis.matchedKeywords,
      requires_attention: analysis.requiresAttention,
      status: 'open',
    });
  }

  async listAlerts(query: AlertsListQuery = {}): Promise<PaginatedAlertsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.sentiment) {
      where.sentiment = query.sentiment;
    }
    if (query.status) {
      where.status = query.status;
    }

    const { rows, count } = await SupportAlert.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const total = typeof count === 'number' ? count : 0;
    return {
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateAlertStatus(id: string, status: AlertStatus): Promise<SupportAlert> {
    const alert = await SupportAlert.findByPk(id);
    if (!alert) {
      throw new AppError('Support alert not found', 404, 'ALERT_NOT_FOUND');
    }
    await alert.update({ status });
    return alert;
  }
}

export const automationService = new AutomationService();
