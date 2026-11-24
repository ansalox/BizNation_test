import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  Course,
  CourseListParams,
  CreateCoursePayload,
  CreateLessonPayload,
  Lesson,
  PaginatedResponse,
} from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly coursesUrl = `${environment.apiUrl}/courses`;
  private readonly lessonsUrl = `${environment.apiUrl}/lessons`;

  getCourses(params: CourseListParams = {}): Observable<PaginatedResponse<Course>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    if (params.title && params.title.trim()) {
      httpParams = httpParams.set('title', params.title.trim());
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params.minProgress !== undefined && params.minProgress !== null) {
      httpParams = httpParams.set('minProgress', String(params.minProgress));
    }
    if (params.maxProgress !== undefined && params.maxProgress !== null) {
      httpParams = httpParams.set('maxProgress', String(params.maxProgress));
    }
    if (params.published !== undefined) {
      httpParams = httpParams.set('published', String(params.published));
    }

    return this.http.get<PaginatedResponse<Course>>(this.coursesUrl, { params: httpParams });
  }

  getCourseById(id: string): Observable<Course> {
    return this.http
      .get<ApiResponse<Course>>(`${this.coursesUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createCourse(payload: CreateCoursePayload): Observable<Course> {
    return this.http
      .post<ApiResponse<Course>>(this.coursesUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateCourse(id: string, payload: Partial<CreateCoursePayload>): Observable<Course> {
    return this.http
      .patch<ApiResponse<Course>>(`${this.coursesUrl}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteCourse(id: string): Observable<{ deleted: boolean }> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${this.coursesUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createLesson(payload: CreateLessonPayload): Observable<Lesson> {
    return this.http
      .post<ApiResponse<Lesson>>(this.lessonsUrl, payload)
      .pipe(map((response) => response.data));
  }
}
