import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutomationService } from '../../../core/services/automation.service';
import { CourseService } from '../../../core/services/course.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  const getCoursesSpy = vi.fn();
  const deleteCourseSpy = vi.fn();
  const createCourseSpy = vi.fn();
  const getStudentsReportSpy = vi.fn();
  const getAlertsSpy = vi.fn();
  const getWebhookEventsSpy = vi.fn();
  const sendSimulatedWebhookSpy = vi.fn();

  beforeEach(async () => {
    getCoursesSpy.mockReset().mockReturnValue(
      of({
        success: true,
        data: [
          {
            id: 'c-1',
            title: 'Curso Activo',
            description: 'Desc',
            is_published: true,
            created_at: '2026-11-24T00:00:00.000Z',
            lessons: [],
            totalLessons: 3,
            metrics: { totalStudentsWithProgress: 2, averageProgressPercentage: 75 },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      }),
    );
    deleteCourseSpy.mockReset();
    createCourseSpy.mockReset();
    getStudentsReportSpy.mockReset().mockReturnValue(
      of({
        success: true,
        data: [
          {
            id: 'u-1',
            name: 'Laura Gómez',
            email: 'laura@biznation.com',
            classification: 'Alto desempeño',
            score: 92,
            completionPercentage: 87,
            recencyScore: 100,
            completedLessons: 7,
            totalPublishedLessons: 8,
            daysSinceLastActivity: 0,
            last_activity_at: '2026-11-24T00:00:00.000Z',
          },
        ],
        summary: {
          totalStudents: 1,
          averageScore: 92,
          byClassification: {
            'Alto desempeño': 1,
            'En progreso': 0,
            'En riesgo': 0,
            Inactivo: 0,
          },
        },
      }),
    );
    getAlertsSpy.mockReset().mockReturnValue(
      of({ success: true, data: [], total: 0, page: 1, totalPages: 0 }),
    );
    getWebhookEventsSpy.mockReset().mockReturnValue(
      of({ success: true, data: [], total: 0, page: 1, totalPages: 0 }),
    );
    sendSimulatedWebhookSpy.mockReset().mockReturnValue(
      of({
        success: true,
        duplicate: false,
        message: 'Webhook event processed successfully',
        data: {
          id: 'w-1',
          external_event_id: 'wamid_sim_1',
          provider: 'whatsapp_meta',
          event_type: 'message.received',
          payload: {},
          status: 'processed',
          attempts: 1,
          error_log: null,
          created_at: '2026-11-24T00:00:00.000Z',
        },
        alert: {
          id: 'a-1',
          webhook_event_id: 'w-1',
          external_event_id: 'wamid_sim_1',
          sender: '+573001112233',
          message_text: 'Ayuda',
          intent: 'support_request',
          sentiment: 'negative',
          priority: 'high',
          score: 35,
          matched_keywords: ['ayuda'],
          requires_attention: true,
          status: 'open',
          created_at: '2026-11-24T00:00:00.000Z',
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        {
          provide: CourseService,
          useValue: {
            getCourses: getCoursesSpy,
            createCourse: createCourseSpy,
            updateCourse: vi.fn(),
            deleteCourse: deleteCourseSpy,
          },
        },
        {
          provide: AutomationService,
          useValue: {
            getStudentsReport: getStudentsReportSpy,
            getAlerts: getAlertsSpy,
            updateAlertStatus: vi.fn(),
            getWebhookEvents: getWebhookEventsSpy,
            sendSimulatedWebhook: sendSimulatedWebhookSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('displays 409 Conflict message when deleting a course with student progress', async () => {
    deleteCourseSpy.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              success: false,
              error: {
                code: 'COURSE_HAS_PROGRESS',
                message: 'Cannot delete course because students already have recorded lesson progress',
              },
            },
          }),
      ),
    );

    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const deleteBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((btn) => btn.textContent?.trim() === 'Eliminar');
    expect(deleteBtn).toBeDefined();

    deleteBtn!.click();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cannot delete course because students already have recorded lesson progress');
  });

  it('sends simulated signed webhook and reloads live tables', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const submitBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((btn) => btn.textContent?.includes('Enviar evento firmado'));
    expect(submitBtn).toBeDefined();

    submitBtn!.click();
    fixture.detectChanges();

    expect(sendSimulatedWebhookSpy).toHaveBeenCalledTimes(1);
    expect(getWebhookEventsSpy).toHaveBeenCalledTimes(2);
    expect(getAlertsSpy).toHaveBeenCalledTimes(2);
  });
});
