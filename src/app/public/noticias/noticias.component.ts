import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'public_noticias';
const CACHE_TTL = 5 * 60 * 1000;

interface NoticiaDB {
  id: string;
  titulo: string;
  resumen: string;
  imagen_url: string | null;
  categoria: 'noticia' | 'aviso' | 'comunicado';
  fecha_publicacion: string;
  destacado: boolean;
  slug: string;
}

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css',
})
export class NoticiasComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  noticias = signal<NoticiaDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = '';
  filtroCategoria = 'todos';

  readonly categorias = [
    { label: 'Todas', value: 'todos' },
    { label: 'Noticias', value: 'noticia' },
    { label: 'Avisos', value: 'aviso' },
    { label: 'Comunicados', value: 'comunicado' },
  ];

  destacadas = computed(() => this.noticias().filter(n => n.destacado).slice(0, 3));

  noticiasFiltradas = computed(() => {
    let lista = this.noticias();
    if (this.filtroCategoria !== 'todos') lista = lista.filter(n => n.categoria === this.filtroCategoria);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.resumen.toLowerCase().includes(q)
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

    const cached = this.cache.get<NoticiaDB[]>(CACHE_KEY);
    if (cached) {
      this.noticias.set(cached);
      this.cargando.set(false);
      return;
    }

    try {
      const data = await this.supa.getAll<NoticiaDB>('noticias', {
        orderBy: 'fecha_publicacion',
        ascending: false,
        filters: { publicado: true },
      });
      this.noticias.set(data);
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar noticias.');
    } finally {
      this.cargando.set(false);
    }
  }

  etiquetaCategoria(cat: string): string {
    return this.categorias.find(c => c.value === cat)?.label?.replace(/s$/, '') ?? cat;
  }
}
