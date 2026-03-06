import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege las rutas del panel de administración.
 * Redirige a /admin/login si no hay sesión activa.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};

/**
 * Guard que solo permite acceso a administradores.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  router.navigate(['/admin/dashboard']);
  return false;
};

/**
 * Guard para la página de login — redirige al dashboard si ya está logueado.
 */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
