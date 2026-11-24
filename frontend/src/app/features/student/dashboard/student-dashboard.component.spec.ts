import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../../core/models/auth.model';
import { Course, LessonProgress } from '../../../core/models/course.model';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { StudentDashboardComponent } from './student-dashboard.component';

describe('StudentDashboardComponent', () => {
  const sampleCourses: Course[] = [
    {
      id: 'c-1',
      title: 'Emprendimiento Digital',
      description: 'Validación de negocio',
      is_published: true,
      created_at: '2026-11-24T00:00:00.000Z',
      totalLessons: 2,
      completedLessons: 1,
      progressPercentage: 50,
      lessons: [
        {
          id: 'l-1',
          course_id: 'c-1',
          title: 'Propuesta de Valor',
          content: 'Contenido 1',
          order_index: 1,
        },
        {
          id: 'l-2',
          course_id: 'c-1',
          title: 'MVP Rápido',
          content: 'Contenido 2',
          order_index: 2,
        },
      ],
    },
  ];

  const getCoursesSpy = vi.fn();
  const getMyProgressSpy = vi.fn();
  const recordProgressSpy = vi.fn();
  const refreshProfileSpy = vi.fn();

  beforeEach(async () => {
    getCoursesSpy.mockReset().mockReturnValue(
      of({
        success: true,
        data: sampleCourses,
        total: 1,
        page: 1,
        totalPages: 1,
      }),
    );
    getMyProgressSpy.mockReset().mockReturnValue(
      of([
        {
          id: 'p-1',
          user_id: 'u-1',
          course_id: 'c-1',
          lesson_id: 'l-1',
          completed: true,
          completed_at: '2026-11-24T00:00:00.000Z',
        } satisfies LessonProgress,
      ]),
    );
    recordProgressSpy.mockReset().mockReturnValue(
      of({
        id: 'p-2',
        user_id: 'u-1',
        course_id: 'c-1',
        lesson_id: 'l-2',
        completed: true,
        completed_at: '2026-11-24T01:00:00.000Z',
      }),
    );
    refreshProfileSpy.mockReset().mockReturnValue(of(null));

    const currentUserSignal = signal<User | null>({
      id: 'u-1',
      name: 'Laura Gómez',
      email: 'laura@biznation.com',
      role: 'student',
      classification: 'En progreso',
      last_activity_at: '2026-11-24T00:00:00.000Z',
    });

    await TestBed.configureTestingModule({
      imports: [StudentDashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUserSignal.asReadonly(),
            refreshProfile: refreshProfileSpy,
          },
        },
        {
          provide: CourseService,
          useValue: {
            getCourses: getCoursesSpy,
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getMyProgress: getMyProgressSpy,
            recordProgress: recordProgressSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('renders published courses, progress bar, and lessons on init', async () => {
    const fixture = TestBed.createComponent(StudentDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Emprendimiento Digital');
    expect(text).toContain('50%');
    expect(text).toContain('MVP Rápido');
    expect(text).toContain('En progreso');
  });

  it('requests filtered courses when title and minProgress filters are applied', async () => {
    const fixture = TestBed.createComponent(StudentDashboardComponent);
    const component = fixture.componentInstance as unknown as {
      searchTitle: { set: (val: string) => void };
      minProgress: { set: (val: number | null) => void };
      applyFilters: () => void;
    };

    fixture.detectChanges();
    component.searchTitle.set('Finanzas');
    component.minProgress.set(25);
    component.applyFilters();

    expect(getCoursesSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        title: 'Finanzas',
        minProgress: 25,
      }),
    );
  });

  it('marks an incomplete lesson as completed and refreshes progress and profile', async () => {
    const fixture = TestBed.createComponent(StudentDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    const completeBtn = buttons.find((btn) =>
      btn.textContent?.includes('Marcar como completada'),
    );
    expect(completeBtn).toBeDefined();

    completeBtn!.click();
    fixture.detectChanges();

    expect(recordProgressSpy).toHaveBeenCalledWith({
      course_id: 'c-1',
      lesson_id: 'l-2',
      completed: true,
    });
    expect(refreshProfileSpy).toHaveBeenCalledTimes(1);
  });
});
