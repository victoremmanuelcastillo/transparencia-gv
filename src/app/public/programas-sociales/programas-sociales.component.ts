import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'public_programas';
const CACHE_TTL = 5 * 60 * 1000;

type EstatusPrograma = 'activo' | 'en_proceso' | 'finalizado';

interface ProgramaDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  beneficiarios: string | null;
  requisitos: string | null;
  presupuesto: number | null;
  periodo: string | null;
  estatus: EstatusPrograma;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

@Component({
  selector: 'app-programas-sociales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programas-sociales.component.html',
  styleUrl: './programas-sociales.component.css',
})
export class ProgramasSocialesComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  programas = signal<ProgramaDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = '';
  filtroEstatus = 'todos';
  expandido: string | null = null;

  readonly filtros = [
    { label: 'Todos', value: 'todos' },
    { label: 'Activos', value: 'activo' },
    { label: 'En proceso', value: 'en_proceso' },
    { label: 'Finalizados', value: 'finalizado' },
  ];

  readonly estatusLabels: Record<EstatusPrograma, string> = {
    activo: 'Activo',
    en_proceso: 'En proceso',
    finalizado: 'Finalizado',
  };

  programasFiltrados = computed(() => {
    let lista = this.programas();
    if (this.filtroEstatus !== 'todos') {
      lista = lista.filter(p => p.estatus === this.filtroEstatus);
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

    const cached = this.cache.get<ProgramaDB[]>(CACHE_KEY);
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
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch {
      this.error.set('Error al cargar los programas. Intenta de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  toggleExpand(id: string) {
    this.expandido = this.expandido === id ? null : id;
  }
}
