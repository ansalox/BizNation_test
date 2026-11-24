import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertStatus,
  StudentClassification,
  StudentReportItem,
  SupportAlert,
  WebhookEvent,
} from '../../../core/models/automation.model';
import { Course } from '../../../core/models/course.model';
import { AutomationService } from '../../../core/services/automation.service';
import { CourseService } from '../../../core/services/course.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly automationService = inject(AutomationService);

  // Courses state
  protected readonly courses = signal<Course[]>([]);
  protected readonly coursesTotal = signal(0);
  protected readonly coursesPage = signal(1);
  protected readonly coursesTotalPages = signal(0);
  protected readonly courseSearch = signal('');
  protected readonly courseLoading = signal(false);
  protected readonly courseFeedback = signal<string | null>(null);
  protected readonly courseError = signal<string | null>(null);
  protected readonly creatingCourse = signal(false);
  protected readonly deletingCourseId = signal<string | null>(null);

  // Students classification report state
  protected readonly studentsReport = signal<StudentReportItem[]>([]);
  protected readonly reportSummary = signal<{
    totalStudents: number;
    averageScore: number;
    byClassification: Record<StudentClassification, number>;
  }>({
    totalStudents: 0,
    averageScore: 0,
    byClassification: {
      'Alto desempeño': 0,
      'En progreso': 0,
      'En riesgo': 0,
      Inactivo: 0,
    },
  });
  protected readonly reportLoading = signal(false);

  // Webhook simulator & live tables state
  protected readonly webhookEvents = signal<WebhookEvent[]>([]);
  protected readonly supportAlerts = signal<SupportAlert[]>([]);
  protected readonly sendingWebhook = signal(false);
  protected readonly webhookFeedback = signal<string | null>(null);
  protected readonly webhookError = signal<string | null>(null);
  protected readonly lastSentEventId = signal<string | null>(null);

  protected readonly openAlertsCount = computed(
    () => this.supportAlerts().filter((alert) => alert.status === 'open').length,
  );

  protected readonly createCourseForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: [''],
    is_published: [true],
  });

  protected readonly webhookForm = this.fb.nonNullable.group({
    external_event_id: [this.generateEventId(), [Validators.required]],
    event_type: ['message.received', [Validators.required]],
    sender: ['+573001112233', [Validators.required]],
    message: ['Ayuda por favor, no entiendo el error de la lección 1', [Validators.required]],
    secret: ['biznation-dev-webhook-secret', [Validators.required]],
    invalidSignature: [false],
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadCourses();
    this.loadStudentsReport();
    this.loadWebhookEvents();
    this.loadAlerts();
  }

  private generateEventId(): string {
    return `wamid_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  regenerateWebhookEventId(): void {
    this.webhookForm.patchValue({ external_event_id: this.generateEventId() });
  }

  reuseLastWebhookEventId(): void {
    const lastId = this.lastSentEventId();
    if (lastId) {
      this.webhookForm.patchValue({ external_event_id: lastId });
    }
  }

  applyWebhookPreset(message: string): void {
    this.webhookForm.patchValue({ message });
  }

  loadCourses(): void {
    this.courseLoading.set(true);
    this.courseService
      .getCourses({
        page: this.coursesPage(),
        limit: 8,
        title: this.courseSearch(),
      })
      .subscribe({
        next: (res) => {
          this.courseLoading.set(false);
          this.courses.set(res.data);
          this.coursesTotal.set(res.total);
          this.coursesPage.set(res.page);
          this.coursesTotalPages.set(res.totalPages);
        },
        error: (err: unknown) => {
          this.courseLoading.set(false);
          this.courseError.set(extractApiErrorMessage(err, 'No se pudieron cargar los cursos.'));
        },
      });
  }

  searchCourses(): void {
    this.coursesPage.set(1);
    this.loadCourses();
  }

  goToCoursePage(nextPage: number): void {
    if (nextPage < 1 || (this.coursesTotalPages() > 0 && nextPage > this.coursesTotalPages())) {
      return;
    }
    this.coursesPage.set(nextPage);
    this.loadCourses();
  }

  onCreateCourse(): void {
    if (this.createCourseForm.invalid || this.creatingCourse()) {
      this.createCourseForm.markAllAsTouched();
      return;
    }

    this.creatingCourse.set(true);
    this.courseError.set(null);
    this.courseFeedback.set(null);

    const payload = this.createCourseForm.getRawValue();
    this.courseService.createCourse(payload).subscribe({
      next: (created) => {
        this.creatingCourse.set(false);
        this.courseFeedback.set(`Curso "${created.title}" creado correctamente.`);
        this.createCourseForm.reset({ title: '', description: '', is_published: true });
        this.loadCourses();
      },
      error: (err: unknown) => {
        this.creatingCourse.set(false);
        this.courseError.set(extractApiErrorMessage(err, 'Error al crear el curso.'));
      },
    });
  }

  toggleCoursePublish(course: Course): void {
    this.courseError.set(null);
    this.courseFeedback.set(null);
    this.courseService
      .updateCourse(course.id, { is_published: !course.is_published })
      .subscribe({
        next: () => {
          this.courseFeedback.set(
            `Curso "${course.title}" marcado como ${!course.is_published ? 'Publicado' : 'Borrador'}.`,
          );
          this.loadCourses();
        },
        error: (err: unknown) => {
          this.courseError.set(extractApiErrorMessage(err, 'No se pudo actualizar el curso.'));
        },
      });
  }

  onDeleteCourse(course: Course): void {
    if (this.deletingCourseId()) {
      return;
    }
    this.deletingCourseId.set(course.id);
    this.courseError.set(null);
    this.courseFeedback.set(null);

    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        this.deletingCourseId.set(null);
        this.courseFeedback.set(`Curso "${course.title}" eliminado (soft delete).`);
        this.loadCourses();
      },
      error: (err: unknown) => {
        this.deletingCourseId.set(null);
        this.courseError.set(
          extractApiErrorMessage(err, 'No se pudo eliminar el curso.'),
        );
      },
    });
  }

  loadStudentsReport(): void {
    this.reportLoading.set(true);
    this.automationService.getStudentsReport().subscribe({
      next: (res) => {
        this.reportLoading.set(false);
        this.studentsReport.set(res.data);
        this.reportSummary.set(res.summary);
      },
      error: () => {
        this.reportLoading.set(false);
      },
    });
  }

  loadWebhookEvents(): void {
    this.automationService.getWebhookEvents(1, 10).subscribe({
      next: (res) => this.webhookEvents.set(res.data),
      error: () => undefined,
    });
  }

  loadAlerts(): void {
    this.automationService.getAlerts({ page: 1, limit: 15 }).subscribe({
      next: (res) => this.supportAlerts.set(res.data),
      error: () => undefined,
    });
  }

  onSendSimulatedWebhook(): void {
    if (this.webhookForm.invalid || this.sendingWebhook()) {
      this.webhookForm.markAllAsTouched();
      return;
    }

    this.sendingWebhook.set(true);
    this.webhookFeedback.set(null);
    this.webhookError.set(null);

    const formVal = this.webhookForm.getRawValue();
    this.lastSentEventId.set(formVal.external_event_id);

    this.automationService.sendSimulatedWebhook(formVal).subscribe({
      next: (res) => {
        this.sendingWebhook.set(false);
        if (res.duplicate) {
          this.webhookFeedback.set(
            `Idempotencia verificada (200 OK): ${res.message} [ID: ${res.data.external_event_id}]`,
          );
        } else {
          const alertInfo = res.alert
            ? ` | Alerta IA: prioridad ${res.alert.priority.toUpperCase()} (${res.alert.sentiment})`
            : '';
          this.webhookFeedback.set(`Evento procesado (200 OK): ${res.message}${alertInfo}`);
        }
        this.loadWebhookEvents();
        this.loadAlerts();
      },
      error: (err: unknown) => {
        this.sendingWebhook.set(false);
        this.webhookError.set(
          extractApiErrorMessage(err, 'Error al enviar el webhook simulado.'),
        );
      },
    });
  }

  onUpdateAlertStatus(alert: SupportAlert, status: AlertStatus): void {
    this.automationService.updateAlertStatus(alert.id, status).subscribe({
      next: () => this.loadAlerts(),
      error: () => undefined,
    });
  }

  getClassificationBadgeClass(classification: StudentClassification): string {
    switch (classification) {
      case 'Alto desempeño':
        return 'bn-badge-success';
      case 'En progreso':
        return 'bn-badge-info';
      case 'En riesgo':
        return 'bn-badge-warning';
      case 'Inactivo':
      default:
        return 'bn-badge-danger';
    }
  }

  getPriorityBadgeClass(priority: SupportAlert['priority']): string {
    if (priority === 'high') {
      return 'bn-badge-danger';
    }
    if (priority === 'medium') {
      return 'bn-badge-warning';
    }
    return 'bn-badge-neutral';
  }

  getSentimentBadgeClass(sentiment: SupportAlert['sentiment']): string {
    if (sentiment === 'positive') {
      return 'bn-badge-success';
    }
    if (sentiment === 'negative') {
      return 'bn-badge-danger';
    }
    return 'bn-badge-info';
  }
}
