export type StudentClassification =
  | 'Alto desempeño'
  | 'En progreso'
  | 'En riesgo'
  | 'Inactivo';

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
  last_activity_at: string | null;
}

export interface StudentsReportResponse {
  success: boolean;
  data: StudentReportItem[];
  summary: {
    totalStudents: number;
    averageScore: number;
    byClassification: Record<StudentClassification, number>;
  };
}

export type AlertPriority = 'low' | 'medium' | 'high';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type AlertStatus = 'open' | 'reviewed' | 'resolved';

export interface SupportAlert {
  id: string;
  webhook_event_id: string;
  external_event_id: string;
  sender: string | null;
  message_text: string;
  intent: string;
  sentiment: MessageSentiment;
  priority: AlertPriority;
  score: number;
  matched_keywords: string[];
  requires_attention: boolean;
  status: AlertStatus;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  external_event_id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  attempts: number;
  error_log: string | null;
  created_at: string;
}

export interface WebhookSimulateResponse {
  success: boolean;
  duplicate: boolean;
  message: string;
  data: WebhookEvent;
  alert?: SupportAlert;
}
