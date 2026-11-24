import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

interface DemoCredential {
  label: string;
  roleLabel: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly demoCredentials: readonly DemoCredential[] = [
    {
      label: 'Administrador',
      roleLabel: 'Admin',
      email: 'admin@biznation.com',
      password: 'Admin123!',
    },
    {
      label: 'Laura Gómez',
      roleLabel: 'Estudiante 1',
      email: 'laura.gomez@biznation.com',
      password: 'Student123!',
    },
    {
      label: 'Carlos Mendoza',
      roleLabel: 'Estudiante 2',
      email: 'carlos.mendoza@biznation.com',
      password: 'Student123!',
    },
  ];

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate([this.authService.getDefaultRouteForRole()]);
    }
  }

  applyDemoCredential(credential: DemoCredential, autoSubmit = false): void {
    this.form.patchValue({
      email: credential.email,
      password: credential.password,
    });
    this.errorMessage.set(null);

    if (autoSubmit) {
      this.onSubmit();
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        void this.router.navigate([this.authService.getDefaultRouteForRole(user.role)]);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'Credenciales inválidas. Verifica tu correo y contraseña.'),
        );
      },
    });
  }
}
