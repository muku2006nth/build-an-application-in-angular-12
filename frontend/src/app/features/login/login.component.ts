import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);

  readonly roles: UserRole[] = ['General User', 'Admin', 'Super Admin'];
  readonly theme$ = this.themeService.theme$;
  readonly form = this.formBuilder.nonNullable.group({
    userId: ['general', Validators.required],
    password: ['general123', Validators.required],
    role: ['General User' as UserRole, Validators.required]
  });

  loading = false;
  errorMessage = '';
  showPassword = false;

  useDemo(role: UserRole): void {
    let userId = 'general';
    let password = 'general123';
    if (role === 'Admin') {
      userId = 'admin';
      password = 'admin123';
    } else if (role === 'Super Admin') {
      userId = 'superadmin';
      password = 'superadmin123';
    }
    this.form.setValue({
      userId,
      password,
      role
    });
    this.errorMessage = '';
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue()).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to sign in with those credentials.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
