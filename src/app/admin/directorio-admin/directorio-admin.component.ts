import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-directorio-admin',
  standalone: true,
  imports: [],
  template: `
    <section class="page-section">
      <div class="container">
        <h2>Gestionar Directorio de Funcionarios</h2>
        <p>Contenido en desarrollo...</p>
      </div>
    </section>
  `,
  styles: [`
    .page-section { padding: 40px 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    h2 { font-size: 24px; font-weight: 700; color: #1a3c2a; margin-bottom: 16px; }
  `],
})
export class DirectorioAdminComponent implements OnInit {
  ngOnInit() {}
}
