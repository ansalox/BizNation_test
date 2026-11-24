import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  AlertPriority,
  AlertStatus,
  MessageSentiment,
  StudentsReportResponse,
  SupportAlert,
  WebhookEvent,
  WebhookSimulateResponse,
} from '../models/automation.model';
import { PaginatedResponse } from '../models/course.model';

export interface SimulatedWebhookInput {
  external_event_id: string;
  event_type: string;
  sender: string;
  message: string;
  secret: string;
  invalidSignature?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private readonly http = inject(HttpClient);
  private readonly automationUrl = `${environment.apiUrl}/automation`;
  private readonly webhooksUrl = `${environment.apiUrl}/webhooks`;

  getStudentsReport(): Observable<StudentsReportResponse> {
    return this.http.get<StudentsReportResponse>(`${this.automationUrl}/students-report`);
  }

  getAlerts(filters: {
    page?: number;
    limit?: number;
    priority?: AlertPriority | '';
    sentiment?: MessageSentiment | '';
    status?: AlertStatus | '';
  } = {}): Observable<PaginatedResponse<SupportAlert>> {
    let params = new HttpParams();
    if (filters.page) {
      params = params.set('page', String(filters.page));
    }
    if (filters.limit) {
      params = params.set('limit', String(filters.limit));
    }
    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters.sentiment) {
      params = params.set('sentiment', filters.sentiment);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PaginatedResponse<SupportAlert>>(`${this.automationUrl}/alerts`, {
      params,
    });
  }

  updateAlertStatus(id: string, status: AlertStatus): Observable<SupportAlert> {
    return this.http
      .patch<ApiResponse<SupportAlert>>(`${this.automationUrl}/alerts/${id}`, { status })
      .pipe(map((response) => response.data));
  }

  getWebhookEvents(page = 1, limit = 10): Observable<PaginatedResponse<WebhookEvent>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<PaginatedResponse<WebhookEvent>>(`${this.webhooksUrl}/events`, {
      params,
    });
  }

  async signHmacSha256(rawPayload: string, secret: string): Promise<string> {
    const cryptoApi = globalThis.crypto?.subtle;
    if (!cryptoApi) {
      throw new Error('Web Crypto API is unavailable in this environment');
    }

    const encoder = new TextEncoder();
    const key = await cryptoApi.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signatureBuffer = await cryptoApi.sign('HMAC', key, encoder.encode(rawPayload));
    const hex = Array.from(new Uint8Array(signatureBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    return `sha256=${hex}`;
  }

  sendSimulatedWebhook(input: SimulatedWebhookInput): Observable<WebhookSimulateResponse> {
    const payload = {
      external_event_id: input.external_event_id.trim(),
      provider: 'whatsapp_meta',
      event_type: input.event_type,
      sender: input.sender.trim(),
      data: {
        from: input.sender.trim(),
        text: input.message.trim(),
      },
    };
    const rawBody = JSON.stringify(payload);

    const signaturePromise = input.invalidSignature
      ? Promise.resolve('sha256=0000000000000000000000000000000000000000000000000000000000000000')
      : this.signHmacSha256(rawBody, input.secret);

    return from(signaturePromise).pipe(
      switchMap((signature) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        });
        return this.http.post<WebhookSimulateResponse>(
          `${this.webhooksUrl}/whatsapp`,
          rawBody,
          { headers },
        );
      }),
    );
  }
}
