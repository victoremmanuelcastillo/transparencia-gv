import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ========================================
  // RUTAS PÚBLICAS (sitio ciudadano)
  // ========================================
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./public/home/home.component').then(m => m.HomeComponent),
        title: 'Inicio — H. Ayuntamiento de Guadalupe Victoria',
      },
      {
        path: 'transparencia',
        loadComponent: () =>
          import('./public/transparencia/transparencia.component').then(m => m.TransparenciaComponent),
        title: 'Transparencia — Art. 70 LGTAIP',
      },
      {
        path: 'transparencia/:fraccion',
        loadComponent: () =>
          import('./public/transparencia/fraccion-detalle/fraccion-detalle.component').then(m => m.FraccionDetalleComponent),
        title: 'Fracción de Transparencia',
      },
      {
        path: 'informes',
        loadComponent: () =>
          import('./public/informes/informes.component').then(m => m.InformesComponent),
        title: 'Informes y Reportes',
      },
      {
        path: 'programas-sociales',
        loadComponent: () =>
          import('./public/programas-sociales/programas-sociales.component').then(m => m.ProgramasSocialesComponent),
        title: 'Programas Sociales',
      },
      {
        path: 'directorio',
        loadComponent: () =>
          import('./public/directorio/directorio.component').then(m => m.DirectorioComponent),
        title: 'Directorio de Funcionarios',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./public/solicitudes-arco/solicitudes-arco.component').then(m => m.SolicitudesArcoComponent),
        title: 'Solicitudes ARCO',
      },
      {
        path: 'noticias',
        loadComponent: () =>
          import('./public/noticias/noticias.component').then(m => m.NoticiasComponent),
        title: 'Noticias y Avisos',
      },
      {
        path: 'noticias/:slug',
        loadComponent: () =>
          import('./public/noticias/noticia-detalle/noticia-detalle.component').then(m => m.NoticiaDetalleComponent),
        title: 'Noticia',
      },
      {
        path: 'marco-normativo',
        loadComponent: () =>
          import('./public/marco-normativo/marco-normativo.component').then(m => m.MarcoNormativoComponent),
        title: 'Marco Normativo',
      },
      {
        path: 'tramites',
        loadComponent: () =>
          import('./public/tramites/tramites.component').then(m => m.TramitesComponent),
        title: 'Trámites y Servicios',
      },
      {
        path: 'aviso-privacidad',
        loadComponent: () =>
          import('./public/aviso-privacidad/aviso-privacidad.component').then(m => m.AvisoPrivacidadComponent),
        title: 'Aviso de Privacidad',
      },
    ],
  },

  // ========================================
  // RUTAS DE ADMINISTRACIÓN
  // ========================================
  {
    path: 'admin/login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./admin/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión — Panel Admin',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — Admin',
      },
      {
        path: 'transparencia',
        loadComponent: () =>
          import('./admin/transparencia-admin/transparencia-admin.component').then(m => m.TransparenciaAdminComponent),
        title: 'Gestionar Transparencia',
      },
      {
        path: 'informes',
        loadComponent: () =>
          import('./admin/informes-admin/informes-admin.component').then(m => m.InformesAdminComponent),
        title: 'Gestionar Informes',
      },
      {
        path: 'noticias',
        loadComponent: () =>
          import('./admin/noticias-admin/noticias-admin.component').then(m => m.NoticiasAdminComponent),
        title: 'Gestionar Noticias',
      },
      {
        path: 'directorio',
        loadComponent: () =>
          import('./admin/directorio-admin/directorio-admin.component').then(m => m.DirectorioAdminComponent),
        title: 'Gestionar Directorio',
      },
      {
        path: 'programas',
        loadComponent: () =>
          import('./admin/programas-admin/programas-admin.component').then(m => m.ProgramasAdminComponent),
        title: 'Gestionar Programas',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./admin/solicitudes-admin/solicitudes-admin.component').then(m => m.SolicitudesAdminComponent),
        title: 'Gestionar Solicitudes ARCO',
      },
      {
        path: 'tramites',
        loadComponent: () =>
          import('./admin/tramites-admin/tramites-admin.component').then(m => m.TramitesAdminComponent),
        title: 'Gestionar Trámites',
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./admin/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
        title: 'Configuración del Sitio',
      },
    ],
  },

  // 404
  { path: '**', redirectTo: '' },
];
