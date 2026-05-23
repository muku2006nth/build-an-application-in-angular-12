import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';

import { ManagedUser, RecordsResponse, UserProfile, UserRecord } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  records: UserRecord[] = [];
  filteredRecords: UserRecord[] = [];
  users: ManagedUser[] = [];
  scope = '';
  delayMs = 1200;
  loading = true;
  loadingUsers = false;
  elapsedMs = 0;
  filterText = '';
  sortColumn: keyof UserRecord | '' = '';
  sortAsc = true;

  readonly skeletonRows = [1, 2, 3, 4];

  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadDashboard(): void {
    this.loading = true;
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
        this.applyFilter();
        this.toastService.success('Dashboard data loaded successfully.');
        if (profile.role === 'Admin') {
          this.loadUsers();
        }
      },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Unable to load dashboard data.'));
      }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.listUsers(0).pipe(
      finalize(() => { this.loadingUsers = false; })
    ).subscribe({
      next: ({ users }) => {
        this.users = users;
      },
      error: (error: unknown) => {
        console.error('Could not load user list for dashboard', error);
      }
    });
  }

  trackUser(_index: number, user: ManagedUser): string {
    return user.id;
  }

  onDelayChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.delayMs = Number(input.value);
  }

  onFilterChange(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilter();
  }

  sortBy(col: keyof UserRecord): void {
    if (this.sortColumn === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = col;
      this.sortAsc = true;
    }
    this.applyFilter();
  }

  sortIcon(col: keyof UserRecord): string {
    if (this.sortColumn !== col) { return '↕'; }
    return this.sortAsc ? '↑' : '↓';
  }

  trackRecord(_index: number, record: UserRecord): string {
    return record.id;
  }

  private applyFilter(): void {
    let result = [...this.records];

    if (this.filterText) {
      result = result.filter((r) =>
        r.title.toLowerCase().includes(this.filterText)
        || r.category.toLowerCase().includes(this.filterText)
        || r.ownerName.toLowerCase().includes(this.filterText)
        || r.status.toLowerCase().includes(this.filterText)
      );
    }

    if (this.sortColumn) {
      const col = this.sortColumn;
      result.sort((a, b) => {
        const av = String(a[col] ?? '').toLowerCase();
        const bv = String(b[col] ?? '').toLowerCase();
        return this.sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    this.filteredRecords = result;
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
