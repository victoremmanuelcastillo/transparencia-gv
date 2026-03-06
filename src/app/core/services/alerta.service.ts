import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Alerta } from '../models';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private _alertas = signal<Alerta[]>([]);

  alertas = this._alertas.asReadonly();
  noLeidas = computed(() => this._alertas().filter(a => !a.leida));
  countNoLeidas = computed(() => this.noLeidas().length);

  constructor(private supabase: SupabaseService) {}

  async cargarAlertas() {
    const data = await this.supabase.getAll<Alerta>('alertas', {
      orderBy: 'fechaCreacion',
      ascending: false,
      limit: 50,
    });
    this._alertas.set(data);
  }

  async marcarLeida(id: string) {
    await this.supabase.update('alertas', id, { leida: true });
    this._alertas.update(alertas =>
      alertas.map(a => a.id === id ? { ...a, leida: true } : a)
    );
  }

  async marcarTodasLeidas() {
    const noLeidas = this.noLeidas();
    for (const alerta of noLeidas) {
      await this.supabase.update('alertas', alerta.id, { leida: true });
    }
    this._alertas.update(alertas =>
      alertas.map(a => ({ ...a, leida: true }))
    );
  }
}
