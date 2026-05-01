import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'public_tramites';
const CACHE_TTL = 5 * 60 * 1000;

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
  selector: 'app-tramites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.css',
})
export class TramitesComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  tramites = signal<TramiteDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = '';
  filtroArea = 'todos';
  expandido: string | null = null;

  areasDisponibles = computed(() =>
    ['todos', ...new Set(this.tramites().map(t => t.area).filter(Boolean) as string[])]
  );

  tramitesFiltrados = computed(() => {
    let lista = this.tramites();
    if (this.filtroArea !== 'todos') {
      lista = lista.filter(t => t.area === this.filtroArea);
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(t =>
        t.nombre.toLowerCase().includes(q) ||
        t.area?.toLowerCase().includes(q) ||
        t.descripcion?.toLowerCase().includes(q)
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

    const cached = this.cache.get<TramiteDB[]>(CACHE_KEY);
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
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch {
      this.error.set('Error al cargar los trámites. Intenta de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  toggleExpand(id: string) {
    this.expandido = this.expandido === id ? null : id;
  }
}
