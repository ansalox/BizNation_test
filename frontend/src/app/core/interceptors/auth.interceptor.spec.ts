import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'jwt-test-token',
            isAuthenticated: () => true,
            logout: () => undefined,
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Authorization Bearer header when token exists', () => {
    http.get('/api/courses').subscribe();

    const req = httpMock.expectOne('/api/courses');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-test-token');
    req.flush({ success: true, data: [] });
  });

  it('skips Authorization header on signed webhook simulation requests', () => {
    http
      .post('/api/webhooks/whatsapp', '{}', {
        headers: { 'x-hub-signature-256': 'sha256=abc' },
      })
      .subscribe();

    const req = httpMock.expectOne('/api/webhooks/whatsapp');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ success: true });
  });
});
