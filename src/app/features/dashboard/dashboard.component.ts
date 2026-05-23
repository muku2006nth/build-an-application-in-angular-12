import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';

import { RecordsResponse, UserProfile, UserRecord } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  records: UserRecord[] = [];
  scope = '';
  delayMs = 1200;
  loading = true;
  elapsedMs = 0;
  errorMessage = '';
  readonly skeletonRows = [1, 2, 3, 4];

  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.elapsedMs = 0;
    this.startTimer();

    forkJoin({
      profile: this.userService.getProfile(this.delayMs),
      recordResponse: this.userService.getRecords(this.delayMs)
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.stopTimer();
      })
    ).subscribe({
      next: ({ profile, recordResponse }) => {
        this.profile = profile;
        this.records = recordResponse.records;
        this.scope = recordResponse.scope;
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to load dashboard data.';
      }
    });
  }

  onDelayChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.delayMs = Number(input.value);
  }

  trackRecord(_index: number, record: UserRecord): string {
    return record.id;
  }

  private startTimer(): void {
    this.stopTimer();
    const startedAt = Date.now();
    this.timerId = setInterval(() => {
      this.elapsedMs = Date.now() - startedAt;
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
