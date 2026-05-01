import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'public_informes';
const CACHE_TTL = 5 * 60 * 1000;

interface InformeDB {
  id: string;
  titulo: string;
  tipo: 'trimestral' | 'anual' | 'auditoria' | 'financiero' | 'especial';
  archivo_url: string;
  anio: number;
  trimestre: 1 | 2 | 3 | 4 | null;
  fecha_publicacion: string;
  descripcion: string | null;
}

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css',
})
export class InformesComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  informes = signal<InformeDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = '';
  filtroTipo = 'todos';
  filtroAnio = 'todos';

  readonly tiposInforme: { label: string; value: string }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Trimestral', value: 'trimestral' },
    { label: 'Anual', value: 'anual' },
    { label: 'Auditoría', value: 'auditoria' },
    { label: 'Financiero', value: 'financiero' },
    { label: 'Especial', value: 'especial' },
  ];

  aniosDisponibles = computed(() =>
    [...new Set(this.informes().map(i => i.anio))].sort((a, b) => b - a)
  );

  informesFiltrados = computed(() => {
    let lista = this.informes();
    if (this.filtroTipo !== 'todos') lista = lista.filter(i => i.tipo === this.filtroTipo);
    if (this.filtroAnio !== 'todos') lista = lista.filter(i => i.anio === +this.filtroAnio);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(i =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(q))
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

    const cached = this.cache.get<InformeDB[]>(CACHE_KEY);
    if (cached) {
      this.informes.set(cached);
      this.cargando.set(false);
      return;
    }

    try {
      const data = await this.supa.getAll<InformeDB>('informes', {
        orderBy: 'fecha_publicacion',
        ascending: false,
      });
      this.informes.set(data);
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar informes.');
    } finally {
      this.cargando.set(false);
    }
  }

  etiquetaTipo(tipo: string): string {
    return this.tiposInforme.find(t => t.value === tipo)?.label ?? tipo;
  }
}
