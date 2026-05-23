import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ManagedUser,
  RecordsResponse,
  UserMutation,
  UserProfile
} from '../models/user.model';

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

  listUsers(delayMs = 0): Observable<{ users: ManagedUser[] }> {
    return this.http.get<{ users: ManagedUser[] }>('/api/admin/users', {
      params: this.delayParams(delayMs)
    });
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

  private delayParams(delayMs: number): HttpParams {
    return new HttpParams().set('delay', String(delayMs));
  }
}
