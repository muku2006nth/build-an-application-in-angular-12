import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom, map, tap } from 'rxjs';

import { AuthSession, LoginRequest, UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'role-access-session';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);

  readonly session$ = this.sessionSubject.asObservable();
  readonly currentUser$: Observable<UserProfile | null> = this.session$.pipe(
    map((session) => session?.user ?? null)
  );
  readonly isAdmin$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user?.role === 'Admin')
  );

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get token(): string | null {
    return this.sessionSubject.value?.token ?? null;
  }

  get currentUserSnapshot(): UserProfile | null {
    return this.sessionSubject.value?.user ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.sessionSubject.value?.token);
  }

  login(credentials: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/login', credentials).pipe(
      tap((session) => this.setSession(session))
    );
  }

  async restoreSession(): Promise<void> {
    const rawSession = window.localStorage.getItem(this.storageKey);
    if (!rawSession) {
      return;
    }

    try {
      const savedSession = JSON.parse(rawSession) as AuthSession;
      this.sessionSubject.next(savedSession);

      const response = await firstValueFrom(
        this.http.get<{ user: UserProfile }>('/api/me')
      );

      this.setSession({
        token: savedSession.token,
        user: response.user
      });
    } catch {
      this.clearSession();
    }
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private setSession(session: AuthSession): void {
    this.sessionSubject.next(session);
    window.localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    window.localStorage.removeItem(this.storageKey);
  }
}
