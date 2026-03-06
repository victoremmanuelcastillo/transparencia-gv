import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario = signal<Usuario | null>(null);
  private _loading = signal(true);

  usuario = this._usuario.asReadonly();
  loading = this._loading.asReadonly();
  isLoggedIn = computed(() => !!this._usuario());
  isAdmin = computed(() => this._usuario()?.rol === 'admin');

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {
    this.initAuth();
  }

  private async initAuth() {
    try {
      const { data: { session } } = await this.supabase.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      }
    } finally {
      this._loading.set(false);
    }

    // Escuchar cambios de sesión
    this.supabase.user$.subscribe(async (user) => {
      if (user) {
        await this.loadUserProfile(user.id);
      } else {
        this._usuario.set(null);
      }
    });
  }

  private async loadUserProfile(userId: string) {
    try {
      const profile = await this.supabase.getById<Usuario>('usuarios', userId);
      this._usuario.set(profile);
    } catch {
      this._usuario.set(null);
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.signIn(email, password);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async logout() {
    await this.supabase.signOut();
    this._usuario.set(null);
    this.router.navigate(['/admin/login']);
  }
}
