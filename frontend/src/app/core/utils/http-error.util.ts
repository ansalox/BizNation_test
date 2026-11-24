import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorPayload } from '../models/auth.model';

export function extractApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiErrorPayload> | undefined;
    if (body?.error?.message) {
      return body.error.message;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor backend.';
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
