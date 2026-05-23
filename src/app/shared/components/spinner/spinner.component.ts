import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: false,
  template: `
    <span class="spinner" [class.spinner--sm]="size === 'sm'" [attr.aria-label]="label" role="status">
      <span class="spinner-ring"></span>
    </span>
  `,
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' = 'md';
  @Input() label = 'Loading…';
}
