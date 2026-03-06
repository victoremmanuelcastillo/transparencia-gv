import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="header-top">
        <div class="container">
          <div class="brand">
            <img src="/assets/escudo-gv.png" alt="Escudo" class="escudo" />
            <div>
              <h1>H. Ayuntamiento de Guadalupe Victoria</h1>
              <p>Gobierno Municipal 2025-2028 · Durango</p>
            </div>
          </div>
        </div>
      </div>
      <nav class="main-nav">
        <div class="container nav-container">
          @for (link of navLinks; track link.ruta) {
            <a [routerLink]="link.ruta" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: link.exact ?? false }">
              {{ link.nombre }}
            </a>
          }
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .site-header { background: #1a3c2a; color: white; }
    .header-top { padding: 16px 0; border-bottom: 3px solid #c8a84b; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .escudo { height: 52px; }
    .brand h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
    .brand p { font-size: 12px; opacity: 0.65; margin-top: 2px; }
    .main-nav { background: #143222; }
    .nav-container { display: flex; gap: 2px; overflow-x: auto; }
    .main-nav a {
      padding: 12px 16px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }
    .main-nav a:hover { color: white; background: rgba(255,255,255,0.05); }
    .main-nav a.active { color: white; border-bottom-color: #c8a84b; }
  `],
})
export class HeaderComponent {
  navLinks = [
    { nombre: 'Inicio', ruta: '/', exact: true },
    { nombre: 'Transparencia', ruta: '/transparencia' },
    { nombre: 'Informes', ruta: '/informes' },
    { nombre: 'Programas Sociales', ruta: '/programas-sociales' },
    { nombre: 'Directorio', ruta: '/directorio' },
    { nombre: 'Solicitudes ARCO', ruta: '/solicitudes' },
    { nombre: 'Noticias', ruta: '/noticias' },
    { nombre: 'Marco Normativo', ruta: '/marco-normativo' },
    { nombre: 'Trámites', ruta: '/tramites' },
  ];
}
