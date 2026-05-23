import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <section class="not-found-page">
      <div class="not-found-code">404</div>
      <h1>Page not found</h1>
      <p>The route you requested does not exist in this workspace.</p>
      <a class="btn" routerLink="/dashboard">Back to Dashboard</a>
    </section>
  `,
  styles: [`
    .not-found-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      gap: 16px;
      text-align: center;
      animation: page-in 350ms ease both;
    }
    .not-found-code {
      font-size: clamp(5rem, 16vw, 9rem);
      font-weight: 900;
      background: linear-gradient(135deg, var(--teal), var(--blue));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    h1 { margin: 0; font-size: 1.6rem; }
    p  { color: var(--muted); margin: 0 0 8px; }
  `]
})
export class NotFoundComponent {}
