import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ManagedUser, UserMutation, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

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
  editingUser: ManagedUser | null = null;
  delayMs = 600;
  loading = false;
  saving = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.listUsers(this.delayMs).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: ({ users }) => {
        this.users = users;
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to load users.';
      }
    });
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
    this.errorMessage = '';
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
    this.errorMessage = '';
  }

  saveUser(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    if (!this.editingUser && rawValue.password.trim().length < 6) {
      this.errorMessage = 'New users need a password with at least 6 characters.';
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
    this.errorMessage = '';

    const request = this.editingUser
      ? this.userService.updateUser(this.editingUser.id, payload)
      : this.userService.createUser(payload);

    request.pipe(
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadUsers();
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to save user.';
      }
    });
  }

  deleteUser(user: ManagedUser): void {
    if (this.isCurrentUser(user) || !window.confirm(`Remove ${user.displayName}?`)) {
      return;
    }

    this.errorMessage = '';
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((candidate) => candidate.id !== user.id);
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to delete user.';
      }
    });
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
}
