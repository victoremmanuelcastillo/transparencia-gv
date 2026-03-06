import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading">
      <div class="spinner"></div>
      @if (mensaje()) { <p>{{ mensaje() }}</p> }
    </div>
  `,
  styles: [`
    .loading { display: flex; flex-direction: column; align-items: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e0e0e0; border-top-color: #1a3c2a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { margin-top: 12px; font-size: 13px; color: #666; }
  `],
})
export class LoadingComponent {
  mensaje = input<string>('');
}
