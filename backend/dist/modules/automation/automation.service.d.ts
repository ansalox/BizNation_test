import { SupportAlert, WebhookEvent } from '../../database/models';
import type { AlertPriority, AlertStatus, MessageSentiment } from './supportAlert.model';
export type StudentClassification = 'Alto desempeño' | 'En progreso' | 'En riesgo' | 'Inactivo';
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
export declare class AutomationService {
    /**
     * Computes recency score (0-100) from days elapsed since `last_activity_at`.
     */
    calculateRecencyScore(lastActivityAt: Date | string | null, now?: Date): {
        recencyScore: number;
        daysSinceLastActivity: number | null;
    };
    /**
     * Classifies a numeric score (0-100) into Biz Nation student segments.
     */
    classifyScore(score: number): StudentClassification;
    /**
     * Combines lesson completion (60%) and activity recency (40%) into a 0-100 score.
     */
    calculateStudentScore(input: ScoreCalculationInput): ScoreCalculationResult;
    /**
     * Evaluates a student's progress and persists the updated `classification` on `users`.
     */
    evaluateAndClassifyStudent(userId: string): Promise<ScoreCalculationResult | null>;
    /**
     * Generates a complete scoring & classification report for all active students (Admin only).
     */
    getStudentsReport(): Promise<StudentsReportResponse>;
    /**
     * Weighted keyword & intent analyzer for incoming WhatsApp/Meta messages.
     */
    analyzeMessage(messageText: string): MessageAnalysisResult;
    extractWebhookMessageContent(payload: Record<string, unknown>): {
        messageText?: string;
        sender?: string;
    };
    analyzeAndRecordWebhookAlert(webhookEvent: WebhookEvent, rawPayload: Record<string, unknown>): Promise<SupportAlert | null>;
    listAlerts(query?: AlertsListQuery): Promise<PaginatedAlertsResult>;
    updateAlertStatus(id: string, status: AlertStatus): Promise<SupportAlert>;
}
export declare const automationService: AutomationService;
