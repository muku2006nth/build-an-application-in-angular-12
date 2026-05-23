import { Injectable } from '@angular/core';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppLoadService {
  constructor(private readonly authService: AuthService) {}

  load(): Promise<void> {
    return this.authService.restoreSession();
  }
}
