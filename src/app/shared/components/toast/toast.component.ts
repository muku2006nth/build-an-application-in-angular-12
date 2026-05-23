import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="false">
      <div
        *ngFor="let t of toastService.toasts$ | async; trackBy: trackToast"
        class="toast"
        [class.toast--success]="t.type === 'success'"
        [class.toast--error]="t.type === 'error'"
        [class.toast--info]="t.type === 'info'"
      >
        <span class="toast-icon" aria-hidden="true">
          {{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" type="button" (click)="toastService.dismiss(t.id)" aria-label="Dismiss">✕</button>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  trackToast(_index: number, toast: { id: string }): string {
    return toast.id;
  }
}
