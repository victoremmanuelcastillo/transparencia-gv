import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h3>H. Ayuntamiento de Guadalupe Victoria</h3>
            <p>Gobierno Municipal 2025-2028</p>
            <p>Guadalupe Victoria, Durango, México</p>
          </div>
          <div>
            <h4>Contacto</h4>
            <p>📧 transparencia&#64;guadalupevictoria.gob.mx</p>
            <p>📞 (674) xxx-xxxx</p>
          </div>
          <div>
            <h4>Enlaces</h4>
            <a routerLink="/transparencia">Transparencia</a>
            <a routerLink="/solicitudes">Solicitudes ARCO</a>
            <a routerLink="/aviso-privacidad">Aviso de Privacidad</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 H. Ayuntamiento de Guadalupe Victoria. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer { background: #1c1c1e; color: rgba(255,255,255,0.6); padding: 40px 0 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .footer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
    h3 { color: white; font-size: 15px; margin-bottom: 8px; }
    h4 { color: #c8a84b; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    p { font-size: 13px; margin: 4px 0; }
    a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; margin: 4px 0; }
    a:hover { color: white; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 32px; padding: 16px 0; text-align: center; font-size: 11px; }
    @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr; } }
  `],
})
export class FooterComponent {}
