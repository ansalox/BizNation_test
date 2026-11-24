import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { LessonProgress, RecordProgressPayload } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/progress`;

  getMyProgress(courseId?: string): Observable<LessonProgress[]> {
    let params = new HttpParams();
    if (courseId) {
      params = params.set('courseId', courseId);
    }
    return this.http
      .get<ApiResponse<LessonProgress[]>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  recordProgress(payload: RecordProgressPayload): Observable<LessonProgress> {
    return this.http
      .post<ApiResponse<LessonProgress>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }
}
