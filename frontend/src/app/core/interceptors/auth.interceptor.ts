import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isWebhookSignatureRequest = req.headers.has('x-hub-signature-256');
  const authReq =
    token && !isWebhookSignatureRequest && !req.headers.has('Authorization')
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isWebhookSignatureRequest &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        authService.isAuthenticated()
      ) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
