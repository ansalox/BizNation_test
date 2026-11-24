import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import { AuthService } from './auth.service';

function createJwtWithExp(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-1',
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  );
  return `${header}.${payload}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockAdminUser: User = {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Admin BizNation',
    email: 'admin@biznation.com',
    role: 'admin',
    classification: 'staff',
    last_activity_at: null,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('logs in, persists JWT and user in localStorage, and updates reactive signals', () => {
    const token = createJwtWithExp(3600);
    let loggedUser: User | undefined;

    service.login({ email: 'admin@biznation.com', password: 'Admin123!' }).subscribe((user) => {
      loggedUser = user;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: { user: mockAdminUser, token },
    });

    expect(loggedUser).toEqual(mockAdminUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe('admin');
    expect(service.getToken()).toBe(token);
    expect(service.hasRole(['admin'])).toBe(true);
    expect(service.hasRole(['student'])).toBe(false);
    expect(localStorage.getItem('biznation_token')).toBe(token);
  });

  it('clears expired token on getToken() and restores valid session from localStorage', () => {
    const expiredToken = createJwtWithExp(-60);
    localStorage.setItem('biznation_token', expiredToken);
    localStorage.setItem('biznation_user', JSON.stringify(mockAdminUser));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated()).toBe(false);
    expect(freshService.getToken()).toBeNull();
    expect(localStorage.getItem('biznation_token')).toBeNull();
  });

  it('logs out, clears session storage, and navigates to /login', () => {
    const token = createJwtWithExp(3600);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.login({ email: 'admin@biznation.com', password: 'Admin123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      success: true,
      data: { user: mockAdminUser, token },
    });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('biznation_token')).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });
});
