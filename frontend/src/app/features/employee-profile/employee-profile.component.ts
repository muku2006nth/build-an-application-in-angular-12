import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ActivityEntry,
  EmployeeProfile,
  PerformanceStats,
  TaskRecord,
  TaskStatus
} from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-employee-profile',
  standalone: false,
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.scss']
})
export class EmployeeProfileComponent implements OnInit {
  profile: EmployeeProfile | null = null;
  filteredTasks: TaskRecord[] = [];
  loading = true;

  filterStatus: TaskStatus | '' = '';
  filterText = '';
  sortAsc = false; // newest due-date first by default

  readonly statusOptions: (TaskStatus | '')[] = ['', 'Completed', 'In Progress', 'Pending', 'Overdue', 'Cancelled'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.userService.getEmployeeProfile(id).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (data) => {
        this.profile = data;
        this.applyFilter();
        this.toastService.info(`Loaded profile for ${data.user.displayName}.`);
      },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Could not load employee profile.'));
        void this.router.navigate(['/admin/users']);
      }
    });
  }

  goBack(): void {
    void this.router.navigate(['/admin/users']);
  }

  onFilterText(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilter();
  }

  onFilterStatus(event: Event): void {
    this.filterStatus = (event.target as HTMLSelectElement).value as TaskStatus | '';
    this.applyFilter();
  }

  toggleSort(): void {
    this.sortAsc = !this.sortAsc;
    this.applyFilter();
  }

  scoreClass(score: number | undefined): string {
    if (score === undefined) { return ''; }
    if (score >= 90) { return 'score-excellent'; }
    if (score >= 75) { return 'score-good'; }
    if (score >= 60) { return 'score-average'; }
    return 'score-poor';
  }

  statusClass(status: TaskStatus): string {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  }

  priorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  trackTask(_i: number, t: TaskRecord): string { return t.id; }
  trackActivity(_i: number, a: ActivityEntry): string { return a.timestamp; }

  get stats(): PerformanceStats | null {
    return this.profile?.stats ?? null;
  }

  private applyFilter(): void {
    if (!this.profile) { return; }
    let tasks = [...this.profile.tasks];

    if (this.filterStatus) {
      tasks = tasks.filter((t) => t.status === this.filterStatus);
    }

    if (this.filterText) {
      tasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(this.filterText)
        || t.category.toLowerCase().includes(this.filterText)
        || t.description.toLowerCase().includes(this.filterText)
      );
    }

    tasks.sort((a, b) => {
      const cmp = a.dueDate.localeCompare(b.dueDate);
      return this.sortAsc ? cmp : -cmp;
    });

    this.filteredTasks = tasks;
  }
}
