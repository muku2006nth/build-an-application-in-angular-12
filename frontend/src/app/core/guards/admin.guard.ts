import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    const role = this.authService.currentUserSnapshot?.role;
    if (role === 'Admin' || role === 'Super Admin') {
      return true;
    }

    return this.router.createUrlTree(['/dashboard']);
  }
}
