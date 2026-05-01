import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const ADMIN_CACHE_KEY = 'admin_tramites';
const PUBLIC_CACHE_KEY = 'public_tramites';
const CACHE_TTL = 2 * 60 * 1000;

interface TramiteDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  area: string | null;
  requisitos: string | null;
  costo: string | null;
  tiempo_respuesta: string | null;
  horario: string | null;
  ubicacion: string | null;
  formato_url: string | null;
  created_at: string;
}

@Component({
  selector: 'app-tramites-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tramites-admin.component.html',
  styleUrl: './tramites-admin.component.css',
})
export class TramitesAdminComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  tramites = signal<TramiteDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = '';
  modoModal: 'crear' | 'editar' | null = null;
  eliminando: string | null = null;

  form: Partial<TramiteDB> = {};

  tramitesFiltrados = computed(() => {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.tramites();
    return this.tramites().filter(t =>
      t.nombre.toLowerCase().includes(q) ||
      t.area?.toLowerCase().includes(q) ||
      t.descripcion?.toLowerCase().includes(q)
    );
  });

  constructor(supabase: SupabaseService, cache: CacheService) {
    this.supa = supabase;
    this.cache = cache;
  }

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);
    this.error.set(null);

    const cached = this.cache.get<TramiteDB[]>(ADMIN_CACHE_KEY);
    if (cached) {
      this.tramites.set(cached);
      this.cargando.set(false);
      return;
    }

    try {
      const data = await this.supa.getAll<TramiteDB>('tramites', {
        orderBy: 'nombre',
        ascending: true,
      });
      this.tramites.set(data);
      this.cache.set(ADMIN_CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cargando.set(false);
    }
  }

  private invalidarCache() {
    this.cache.invalidate(ADMIN_CACHE_KEY);
    this.cache.invalidate(PUBLIC_CACHE_KEY);
  }

  abrirCrear() {
    this.form = { costo: 'Gratuito' };
    this.modoModal = 'crear';
  }

  abrirEditar(t: TramiteDB) {
    this.form = { ...t };
    this.modoModal = 'editar';
  }

  cerrarModal() {
    this.modoModal = null;
    this.form = {};
  }

  async guardar() {
    if (!this.form.nombre?.trim()) return;
    this.guardando.set(true);
    try {
      const payload: Partial<TramiteDB> = {
        nombre: this.form.nombre!.trim(),
        descripcion: this.form.descripcion ?? null,
        area: this.form.area ?? null,
        requisitos: this.form.requisitos ?? null,
        costo: this.form.costo ?? 'Gratuito',
        tiempo_respuesta: this.form.tiempo_respuesta ?? null,
        horario: this.form.horario ?? null,
        ubicacion: this.form.ubicacion ?? null,
        formato_url: this.form.formato_url ?? null,
      };

      if (this.modoModal === 'crear') {
        const nuevo = await this.supa.insert<TramiteDB>('tramites', payload);
        this.tramites.update(lista => [...lista, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } else {
        const actualizado = await this.supa.update<TramiteDB>('tramites', this.form.id!, payload);
        this.tramites.update(lista =>
          lista.map(t => t.id === actualizado.id ? actualizado : t)
        );
      }
      this.invalidarCache();
      this.cerrarModal();
    } catch (e: any) {
      alert('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(t: TramiteDB) {
    if (!confirm(`¿Eliminar "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.eliminando = t.id;
    try {
      await this.supa.delete('tramites', t.id);
      this.tramites.update(lista => lista.filter(x => x.id !== t.id));
      this.invalidarCache();
    } catch (e: any) {
      alert('Error al eliminar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.eliminando = null;
    }
  }
}
