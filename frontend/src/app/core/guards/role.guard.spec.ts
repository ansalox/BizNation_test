import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: Router;
  let mockAuthenticated = false;
  let mockRole: UserRole | null = null;

  const mockAuthService = {
    isAuthenticated: () => mockAuthenticated,
    userRole: () => mockRole,
    hasRole: (roles: UserRole[]) => mockRole !== null && roles.includes(mockRole),
    getDefaultRouteForRole: () =>
      mockRole === 'admin' ? '/admin' : mockRole === 'student' ? '/student' : '/login',
  };

  beforeEach(() => {
    mockAuthenticated = false;
    mockRole = null;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    router = TestBed.inject(Router);
  });

  const runGuard = (allowedRoles: UserRole[]) => {
    const route = { data: { roles: allowedRoles } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/protected' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, state));
  };

  it('redirects to /login when user is not authenticated', () => {
    const result = runGuard(['admin']);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('redirects student to /student when attempting to access admin route', () => {
    mockAuthenticated = true;
    mockRole = 'student';

    const result = runGuard(['admin']);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/student');
  });

  it('redirects admin to /admin when attempting to access student-only route', () => {
    mockAuthenticated = true;
    mockRole = 'admin';

    const result = runGuard(['student']);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin');
  });

  it('allows access when authenticated user role matches route roles', () => {
    mockAuthenticated = true;
    mockRole = 'admin';

    const result = runGuard(['admin']);
    expect(result).toBe(true);
  });
});
