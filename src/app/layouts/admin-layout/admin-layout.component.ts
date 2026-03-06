import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertaService } from '../../core/services/alerta.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  template: `
    <div class="admin-layout" [ngClass]="{ 'sidebar-collapsed': sidebarCollapsed() }">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="/assets/escudo-gv.png" alt="Escudo" class="escudo" />
          @if (!sidebarCollapsed()) {
            <div class="sidebar-title">
              <span class="municipio">Guadalupe Victoria</span>
              <span class="subtitulo">Panel de Administración</span>
            </div>
          }
          <button class="toggle-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '☰' : '✕' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of menuItems; track item.ruta) {
            <a [routerLink]="item.ruta"
               routerLinkActive="active"
               class="nav-item">
              <span class="nav-icon">{{ item.icono }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.nombre }}</span>
              }
              @if (item.badge && item.badge() > 0 && !sidebarCollapsed()) {
                <span class="badge">{{ item.badge() }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="auth.logout()">
            <span>🚪</span>
            @if (!sidebarCollapsed()) { <span>Cerrar sesión</span> }
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <div class="admin-main">
        <header class="admin-topbar">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
          <div class="topbar-actions">
            <span class="user-name">{{ auth.usuario()?.nombre }}</span>
          </div>
        </header>
        <div class="admin-content">
          <router-outlet />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .sidebar {
      width: 260px;
      background: #1a3c2a;
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }
    .sidebar-collapsed .sidebar { width: 72px; }
    .sidebar-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .escudo { width: 36px; height: 36px; object-fit: contain; }
    .sidebar-title { flex: 1; }
    .municipio { font-size: 13px; font-weight: 600; display: block; }
    .subtitulo { font-size: 10px; opacity: 0.6; }
    .toggle-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
    }
    .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 13px;
      transition: all 0.2s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active {
      background: rgba(255,255,255,0.12);
      color: white;
      border-right: 3px solid #c8a84b;
    }
    .nav-icon { font-size: 18px; }
    .badge {
      margin-left: auto;
      background: #c0392b;
      color: white;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 10px;
      font-weight: 600;
    }
    .sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 13px;
      width: 100%;
      padding: 8px 0;
    }
    .logout-btn:hover { color: white; }

    .admin-main {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }
    .sidebar-collapsed .admin-main { margin-left: 72px; }
    .admin-topbar {
      height: 56px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }
    .page-title { font-size: 16px; font-weight: 600; color: #1c1c1e; }
    .user-name { font-size: 13px; color: #666; }
    .admin-content { padding: 24px; }
  `],
})
export class AdminLayoutComponent {
  sidebarCollapsed = signal(false);
  currentPageTitle = 'Dashboard';

  menuItems: { nombre: string; icono: string; ruta: string; badge?: () => number }[];

  constructor(
    public auth: AuthService,
    private alertaService: AlertaService,
  ) {
    this.menuItems = [
      { nombre: 'Dashboard', icono: '📊', ruta: '/admin/dashboard' },
      { nombre: 'Transparencia', icono: '📋', ruta: '/admin/transparencia' },
      { nombre: 'Informes', icono: '📑', ruta: '/admin/informes' },
      { nombre: 'Noticias', icono: '📰', ruta: '/admin/noticias' },
      { nombre: 'Directorio', icono: '👥', ruta: '/admin/directorio' },
      { nombre: 'Programas Sociales', icono: '🤝', ruta: '/admin/programas' },
      { nombre: 'Solicitudes ARCO', icono: '📬', ruta: '/admin/solicitudes', badge: () => this.alertaService.countNoLeidas() },
      { nombre: 'Trámites', icono: '📝', ruta: '/admin/tramites' },
      { nombre: 'Configuración', icono: '⚙️', ruta: '/admin/configuracion' },
    ];
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }
}
