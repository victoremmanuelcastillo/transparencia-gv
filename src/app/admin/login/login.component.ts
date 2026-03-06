import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <img src="/assets/escudo-gv.png" alt="Escudo" class="escudo" />
          <h1>Panel de Administración</h1>
          <p>H. Ayuntamiento de Guadalupe Victoria</p>
        </div>

        <div class="login-form">
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <label>
            <span>Correo electrónico</span>
            <input type="email"
                   [(ngModel)]="email"
                   placeholder="usuario@guadalupevictoria.gob.mx"
                   [disabled]="loading()" />
          </label>

          <label>
            <span>Contraseña</span>
            <input type="password"
                   [(ngModel)]="password"
                   placeholder="••••••••"
                   [disabled]="loading()"
                   (keyup.enter)="login()" />
          </label>

          <button class="login-btn"
                  (click)="login()"
                  [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </div>

        <div class="login-footer">
          <p>Secretaría de Transparencia · Gobierno Municipal 2025-2028</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a3c2a 0%, #0f2318 100%);
      padding: 24px;
    }
    .login-card {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .login-header {
      text-align: center;
      padding: 32px 32px 24px;
      background: #f8faf9;
      border-bottom: 3px solid #c8a84b;
    }
    .escudo { height: 64px; margin-bottom: 12px; }
    h1 { font-size: 18px; color: #1a3c2a; font-weight: 700; }
    .login-header p { font-size: 12px; color: #666; margin-top: 4px; }
    .login-form { padding: 28px 32px; }
    label { display: block; margin-bottom: 16px; }
    label span { display: block; font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px; }
    input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #1a3c2a; }
    .login-btn {
      width: 100%;
      padding: 12px;
      background: #1a3c2a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .login-btn:hover:not(:disabled) { background: #2d5a3f; }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg {
      background: #fef2f2;
      color: #c0392b;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
      border: 1px solid #fecaca;
    }
    .login-footer { text-align: center; padding: 16px; }
    .login-footer p { font-size: 11px; color: #999; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    if (!this.email || !this.password) {
      this.error.set('Ingresa correo y contraseña');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.login(this.email, this.password);

    if (result.success) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.error.set(result.error ?? 'Error al iniciar sesión');
    }

    this.loading.set(false);
  }
}
