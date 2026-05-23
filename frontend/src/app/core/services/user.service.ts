import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AuditEntry,
  EmployeeProfile,
  ManagedUser,
  RecordsResponse,
  UserMutation,
  UserProfile
} from '../models/user.model';

export interface UsersPage {
  users: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HealthStatus {
  status: string;
  storage: string;
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  memoryMb: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getProfile(delayMs = 0): Observable<UserProfile> {
    return this.http.get<{ user: UserProfile }>('/api/me', {
      params: this.delayParams(delayMs)
    }).pipe(
      map((response) => response.user)
    );
  }

  getRecords(delayMs = 0): Observable<RecordsResponse> {
    return this.http.get<RecordsResponse>('/api/records', {
      params: this.delayParams(delayMs)
    });
  }

  listUsers(delayMs = 0, page = 1, limit = 50): Observable<UsersPage> {
    const params = this.delayParams(delayMs).set('page', String(page)).set('limit', String(limit));
    return this.http.get<UsersPage>('/api/admin/users', { params });
  }

  createUser(payload: UserMutation): Observable<{ user: ManagedUser }> {
    return this.http.post<{ user: ManagedUser }>('/api/admin/users', payload);
  }

  updateUser(id: string, payload: UserMutation): Observable<{ user: ManagedUser }> {
    return this.http.put<{ user: ManagedUser }>(`/api/admin/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<{ deleted: true }> {
    return this.http.delete<{ deleted: true }>(`/api/admin/users/${id}`);
  }

  listAudit(): Observable<{ entries: AuditEntry[]; total: number }> {
    return this.http.get<{ entries: AuditEntry[]; total: number }>('/api/admin/audit');
  }

  getEmployeeProfile(userId: string, delayMs = 0): Observable<EmployeeProfile> {
    return this.http.get<EmployeeProfile>(`/api/admin/users/${userId}/profile`, {
      params: this.delayParams(delayMs)
    });
  }

  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>('/api/health');
  }

  private delayParams(delayMs: number): HttpParams {
    return new HttpParams().set('delay', String(delayMs));
  }
}

