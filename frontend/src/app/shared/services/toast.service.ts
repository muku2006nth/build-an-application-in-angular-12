import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, durationMs = 3500): void {
    this.push({ message, type: 'success' }, durationMs);
  }

  error(message: string, durationMs = 5000): void {
    this.push({ message, type: 'error' }, durationMs);
  }

  info(message: string, durationMs = 3500): void {
    this.push({ message, type: 'info' }, durationMs);
  }

  dismiss(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }

  private push(partial: Omit<Toast, 'id'>, durationMs: number): void {
    const toast: Toast = { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...partial };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }
}
