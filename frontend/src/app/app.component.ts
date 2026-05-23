import { Component, inject } from '@angular/core';

import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly isAdmin$ = this.authService.isAdmin$;
  readonly theme$ = this.themeService.theme$;

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
