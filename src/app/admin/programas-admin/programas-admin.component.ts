import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const ADMIN_CACHE_KEY = 'admin_programas';
const PUBLIC_CACHE_KEY = 'public_programas';
const CACHE_TTL = 2 * 60 * 1000;

type EstatusPrograma = 'activo' | 'en_proceso' | 'finalizado';

interface ProgramaDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  beneficiarios: string | null;
  requisitos: string | null;
  presupuesto: number | null;
  imagen_url: string | null;
  periodo: string | null;
  estatus: EstatusPrograma;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

@Component({
  selector: 'app-programas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programas-admin.component.html',
  styleUrl: './programas-admin.component.css',
})
export class ProgramasAdminComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  programas = signal<ProgramaDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = '';
  filtroEstatus: string = 'todos';
  modoModal: 'crear' | 'editar' | null = null;
  eliminando: string | null = null;

  form: Partial<ProgramaDB> = {};

  filtros = [
    { label: 'Todos', value: 'todos' },
    { label: 'Activos', value: 'activo' },
    { label: 'En proceso', value: 'en_proceso' },
    { label: 'Finalizados', value: 'finalizado' },
  ];

  estatusLabels: Record<EstatusPrograma, string> = {
    activo: 'Activo',
    en_proceso: 'En proceso',
    finalizado: 'Finalizado',
  };

  conteo = computed(() => ({
    total: this.programas().length,
    activo: this.programas().filter(p => p.estatus === 'activo').length,
    en_proceso: this.programas().filter(p => p.estatus === 'en_proceso').length,
    finalizado: this.programas().filter(p => p.estatus === 'finalizado').length,
  }));

  programasFiltrados = computed(() => {
    let lista = this.programas();
    if (this.filtroEstatus !== 'todos') {
      lista = lista.filter(p => p.estatus === (this.filtroEstatus as EstatusPrograma));
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.beneficiarios?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      );
    }
    return lista;
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

    const cached = this.cache.get<ProgramaDB[]>(ADMIN_CACHE_KEY);
    if (cached) {
      this.programas.set(cached);
      this.cargando.set(false);
      return;
    }

    try {
      const data = await this.supa.getAll<ProgramaDB>('programas_sociales', {
        orderBy: 'created_at',
        ascending: false,
      });
      this.programas.set(data);
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
    this.form = { estatus: 'activo', presupuesto: 0 };
    this.modoModal = 'crear';
  }

  abrirEditar(p: ProgramaDB) {
    this.form = { ...p };
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
      const payload: Partial<ProgramaDB> = {
        nombre: this.form.nombre!.trim(),
        descripcion: this.form.descripcion ?? null,
        beneficiarios: this.form.beneficiarios ?? null,
        requisitos: this.form.requisitos ?? null,
        presupuesto: this.form.presupuesto ?? 0,
        periodo: this.form.periodo ?? null,
        estatus: this.form.estatus ?? 'activo',
        fecha_inicio: this.form.fecha_inicio ?? null,
        fecha_fin: this.form.fecha_fin ?? null,
      };

      if (this.modoModal === 'crear') {
        const nuevo = await this.supa.insert<ProgramaDB>('programas_sociales', payload);
        this.programas.update(lista => [nuevo, ...lista]);
      } else {
        const actualizado = await this.supa.update<ProgramaDB>('programas_sociales', this.form.id!, payload);
        this.programas.update(lista =>
          lista.map(p => p.id === actualizado.id ? actualizado : p)
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

  async cambiarEstatus(p: ProgramaDB, nuevoEstatus: EstatusPrograma) {
    try {
      await this.supa.update('programas_sociales', p.id, { estatus: nuevoEstatus });
      this.programas.update(lista =>
        lista.map(x => x.id === p.id ? { ...x, estatus: nuevoEstatus } : x)
      );
      this.invalidarCache();
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Error desconocido'));
    }
  }

  async eliminar(p: ProgramaDB) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.eliminando = p.id;
    try {
      await this.supa.delete('programas_sociales', p.id);
      this.programas.update(lista => lista.filter(x => x.id !== p.id));
      this.invalidarCache();
    } catch (e: any) {
      alert('Error al eliminar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.eliminando = null;
    }
  }
}
