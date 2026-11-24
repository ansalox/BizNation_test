import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  AuthData,
  LoginPayload,
  RegisterPayload,
  User,
  UserRole,
} from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'biznation_token';
const USER_STORAGE_KEY = 'biznation_user';

interface JwtClaims {
  exp?: number;
}

function readStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

function removeStorage(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const claims = JSON.parse(json) as JwtClaims;
    if (typeof claims.exp === 'number') {
      return claims.exp * 1000 <= Date.now();
    }
    return false;
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(null);

  readonly currentUser = this.userSignal.asReadonly();
  readonly userRole = computed<UserRole | null>(() => this.userSignal()?.role ?? null);
  readonly isAuthenticated = computed<boolean>(
    () => Boolean(this.tokenSignal() && this.userSignal()),
  );

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = readStorage(TOKEN_STORAGE_KEY);
    const rawUser = readStorage(USER_STORAGE_KEY);

    if (!token || !rawUser || isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as User;
      this.tokenSignal.set(token);
      this.userSignal.set(parsedUser);
    } catch {
      this.clearSession();
    }
  }

  private persistSession(authData: AuthData): void {
    writeStorage(TOKEN_STORAGE_KEY, authData.token);
    writeStorage(USER_STORAGE_KEY, JSON.stringify(authData.user));
    this.tokenSignal.set(authData.token);
    this.userSignal.set(authData.user);
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<ApiResponse<AuthData>>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => this.persistSession(response.data)),
      map((response) => response.data.user),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<ApiResponse<AuthData>>(`${this.baseUrl}/register`, payload).pipe(
      tap((response) => this.persistSession(response.data)),
      map((response) => response.data.user),
    );
  }

  refreshProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me`).pipe(
      tap((response) => {
        writeStorage(USER_STORAGE_KEY, JSON.stringify(response.data));
        this.userSignal.set(response.data);
      }),
      map((response) => response.data),
    );
  }

  getToken(): string | null {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    if (isTokenExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const role = this.userRole();
    return role !== null && allowedRoles.includes(role);
  }

  getDefaultRouteForRole(role: UserRole | null = this.userRole()): string {
    if (role === 'admin') {
      return '/admin';
    }
    if (role === 'student') {
      return '/student';
    }
    return '/login';
  }

  clearSession(): void {
    removeStorage(TOKEN_STORAGE_KEY);
    removeStorage(USER_STORAGE_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}
