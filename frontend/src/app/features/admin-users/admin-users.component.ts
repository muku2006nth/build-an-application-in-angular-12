import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuditEntry, ManagedUser, UserMutation, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../core/utils/api-error';

export type AdminTab = 'users' | 'audit';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly roles: UserRole[] = ['General User', 'Admin'];
  readonly form = this.formBuilder.nonNullable.group({
    userId: ['', Validators.required],
    displayName: ['', Validators.required],
    password: [''],
    role: ['General User' as UserRole, Validators.required],
    department: ['', Validators.required],
    accessLevel: ['Self + public', Validators.required],
    active: [true, Validators.required]
  });

  users: ManagedUser[] = [];
  filteredUsers: ManagedUser[] = [];
  auditEntries: AuditEntry[] = [];
  editingUser: ManagedUser | null = null;
  pendingDeleteUser: ManagedUser | null = null;
  activeTab: AdminTab = 'users';
  delayMs = 600;
  loading = false;
  saving = false;
  loadingAudit = false;
  filterText = '';
  sortAsc = true;

  ngOnInit(): void {
    this.loadUsers();
    this.updateRoleControlState();
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'audit' && this.auditEntries.length === 0) {
      this.loadAudit();
    }
  }

  loadUsers(): void {
    this.loading = true;

    this.userService.listUsers(this.delayMs).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: ({ users }) => {
        this.users = users;
        this.applyFilter();
      },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Unable to load users.'));
      }
    });
  }

  loadAudit(): void {
    this.loadingAudit = true;

    this.userService.listAudit().pipe(
      finalize(() => { this.loadingAudit = false; })
    ).subscribe({
      next: ({ entries }) => { this.auditEntries = entries; },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Unable to load audit log.'));
      }
    });
  }

  onFilterChange(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilter();
  }

  editUser(user: ManagedUser): void {
    this.editingUser = user;
    this.form.setValue({
      userId: user.userId,
      displayName: user.displayName,
      password: '',
      role: user.role,
      department: user.department,
      accessLevel: user.accessLevel,
      active: user.active
    });
    this.updateRoleControlState();
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.form.reset({
      userId: '',
      displayName: '',
      password: '',
      role: 'General User',
      department: '',
      accessLevel: 'Self + public',
      active: true
    });
    this.updateRoleControlState();
  }

  isRoleDropdownEnabled(): boolean {
    const currentUser = this.authService.currentUserSnapshot;
    if (currentUser?.role !== 'Super Admin') {
      return false;
    }
    if (this.editingUser && this.editingUser.role === 'Super Admin') {
      return false;
    }
    return true;
  }

  private updateRoleControlState(): void {
    if (this.isRoleDropdownEnabled()) {
      this.form.controls.role.enable();
    } else {
      this.form.controls.role.disable();
    }
  }

  saveUser(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    if (!this.editingUser && rawValue.password.trim().length < 6) {
      this.toastService.error('New users need a password with at least 6 characters.');
      return;
    }

    const payload: UserMutation = {
      userId: rawValue.userId.trim(),
      displayName: rawValue.displayName.trim(),
      role: rawValue.role,
      department: rawValue.department.trim(),
      accessLevel: rawValue.accessLevel.trim(),
      active: rawValue.active
    };

    if (rawValue.password.trim()) {
      payload.password = rawValue.password.trim();
    }

    this.saving = true;

    const request = this.editingUser
      ? this.userService.updateUser(this.editingUser.id, payload)
      : this.userService.createUser(payload);

    request.pipe(
      finalize(() => { this.saving = false; })
    ).subscribe({
      next: ({ user }) => {
        this.toastService.success(
          this.editingUser
            ? `"${user.displayName}" updated successfully.`
            : `"${user.displayName}" created successfully.`
        );
        this.cancelEdit();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Unable to save user.'));
      }
    });
  }

  requestDelete(user: ManagedUser): void {
    if (this.isCurrentUser(user)) { return; }
    this.pendingDeleteUser = user;
  }

  confirmDelete(): void {
    const user = this.pendingDeleteUser;
    this.pendingDeleteUser = null;
    if (!user) { return; }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.applyFilter();
        this.toastService.success(`"${user.displayName}" removed from the database.`);
      },
      error: (error: unknown) => {
        this.toastService.error(extractApiError(error, 'Unable to delete user.'));
      }
    });
  }

  cancelDelete(): void {
    this.pendingDeleteUser = null;
  }

  onDelayChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.delayMs = Number(input.value);
  }

  isCurrentUser(user: ManagedUser): boolean {
    return this.authService.currentUserSnapshot?.id === user.id;
  }

  trackUser(_index: number, user: ManagedUser): string {
    return user.id;
  }

  trackAudit(_index: number, entry: AuditEntry): string {
    return entry.id;
  }

  private applyFilter(): void {
    if (!this.filterText) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter((u) =>
      u.displayName.toLowerCase().includes(this.filterText)
      || u.userId.toLowerCase().includes(this.filterText)
      || u.role.toLowerCase().includes(this.filterText)
      || u.department.toLowerCase().includes(this.filterText)
    );
  }
}
