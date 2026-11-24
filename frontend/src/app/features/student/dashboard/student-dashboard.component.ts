import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course, Lesson, LessonProgress } from '../../../core/models/course.model';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly progressService = inject(ProgressService);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly courses = signal<Course[]>([]);
  protected readonly selectedCourse = signal<Course | null>(null);
  protected readonly progressRecords = signal<LessonProgress[]>([]);

  protected readonly page = signal(1);
  protected readonly limit = signal(6);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly searchTitle = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly minProgress = signal<number | null>(null);
  protected readonly maxProgress = signal<number | null>(null);

  protected readonly loading = signal(false);
  protected readonly savingLessonId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly feedbackMessage = signal<string | null>(null);

  protected readonly completedLessonIds = computed(() => {
    const ids = new Set<string>();
    for (const record of this.progressRecords()) {
      if (record.completed) {
        ids.add(record.lesson_id);
      }
    }
    return ids;
  });

  protected readonly averageCatalogProgress = computed(() => {
    const list = this.courses();
    if (list.length === 0) {
      return 0;
    }
    const sum = list.reduce((acc, item) => acc + (item.progressPercentage ?? 0), 0);
    return Math.round(sum / list.length);
  });

  ngOnInit(): void {
    this.loadCourses();
    this.loadProgress();
  }

  loadCourses(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.courseService
      .getCourses({
        page: this.page(),
        limit: this.limit(),
        title: this.searchTitle(),
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined,
        minProgress: this.minProgress(),
        maxProgress: this.maxProgress(),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.courses.set(res.data);
          this.total.set(res.total);
          this.page.set(res.page);
          this.totalPages.set(res.totalPages);

          const active = this.selectedCourse();
          if (active) {
            const refreshed = res.data.find((c) => c.id === active.id) ?? null;
            this.selectedCourse.set(refreshed);
          } else if (res.data.length > 0) {
            this.selectedCourse.set(res.data[0]);
          }
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(extractApiErrorMessage(err, 'No se pudieron cargar los cursos.'));
        },
      });
  }

  loadProgress(): void {
    this.progressService.getMyProgress().subscribe({
      next: (records) => this.progressRecords.set(records),
      error: () => {
        // Non-blocking: course list already provides progressPercentage
      },
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadCourses();
  }

  resetFilters(): void {
    this.searchTitle.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.minProgress.set(null);
    this.maxProgress.set(null);
    this.page.set(1);
    this.loadCourses();
  }

  goToPage(nextPage: number): void {
    if (nextPage < 1 || (this.totalPages() > 0 && nextPage > this.totalPages())) {
      return;
    }
    this.page.set(nextPage);
    this.loadCourses();
  }

  selectCourse(course: Course): void {
    this.selectedCourse.set(course);
    this.feedbackMessage.set(null);
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.completedLessonIds().has(lessonId);
  }

  toggleLessonCompletion(course: Course, lesson: Lesson): void {
    if (this.savingLessonId()) {
      return;
    }

    const nextCompleted = !this.isLessonCompleted(lesson.id);
    this.savingLessonId.set(lesson.id);
    this.errorMessage.set(null);
    this.feedbackMessage.set(null);

    this.progressService
      .recordProgress({
        course_id: course.id,
        lesson_id: lesson.id,
        completed: nextCompleted,
      })
      .subscribe({
        next: () => {
          this.savingLessonId.set(null);
          this.feedbackMessage.set(
            nextCompleted
              ? `Lección "${lesson.title}" marcada como completada.`
              : `Progreso de "${lesson.title}" actualizado.`,
          );
          this.loadProgress();
          this.loadCourses();
          this.authService.refreshProfile().subscribe({ error: () => undefined });
        },
        error: (err: unknown) => {
          this.savingLessonId.set(null);
          this.errorMessage.set(
            extractApiErrorMessage(err, 'No se pudo actualizar el progreso de la lección.'),
          );
        },
      });
  }

  getSortedLessons(course: Course): Lesson[] {
    return [...(course.lessons ?? [])].sort((a, b) => a.order_index - b.order_index);
  }
}
