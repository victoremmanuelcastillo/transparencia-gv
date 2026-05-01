import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'admin_noticias';
const CACHE_TTL = 5 * 60 * 1000;

interface NoticiaDB {
  id: string;
  titulo: string;
  contenido: string;
  resumen: string;
  imagen_url: string | null;
  categoria: 'noticia' | 'aviso' | 'comunicado';
  fecha_publicacion: string;
  publicado: boolean;
  destacado: boolean;
  slug: string;
  creado_por: string | null;
  created_at: string;
}

type ModoFormulario = 'crear' | 'editar';

interface FormularioNoticia {
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: NoticiaDB['categoria'];
  publicado: boolean;
  destacado: boolean;
  imagen: File | null;
  imagenUrlActual: string | null;
}

@Component({
  selector: 'app-noticias-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './noticias-admin.component.html',
  styleUrl: './noticias-admin.component.css',
})
export class NoticiasAdminComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  noticias = signal<NoticiaDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  eliminando = signal<string | null>(null);
  cambiandoEstado = signal<string | null>(null);
  desdeCache = signal(false);

  mostrarFormulario = false;
  modoFormulario: ModoFormulario = 'crear';
  noticiaEditandoId: string | null = null;

  busqueda = '';
  filtroCategoria = 'todos';
  filtroEstado = 'todos';
  uploadError: string | null = null;

  formulario: FormularioNoticia = this.formularioVacio();

  readonly categorias: { label: string; value: NoticiaDB['categoria'] }[] = [
    { label: 'Noticia', value: 'noticia' },
    { label: 'Aviso', value: 'aviso' },
    { label: 'Comunicado', value: 'comunicado' },
  ];

  readonly filtrosCategorias = [
    { label: 'Todos', value: 'todos' },
    { label: 'Noticias', value: 'noticia' },
    { label: 'Avisos', value: 'aviso' },
    { label: 'Comunicados', value: 'comunicado' },
  ];

  readonly filtrosEstado = [
    { label: 'Todos', value: 'todos' },
    { label: 'Publicados', value: 'publicado' },
    { label: 'Borradores', value: 'borrador' },
    { label: 'Destacados', value: 'destacado' },
  ];

  conteo = computed(() => {
    const lista = this.noticias();
    return {
      total: lista.length,
      publicados: lista.filter(n => n.publicado).length,
      borradores: lista.filter(n => !n.publicado).length,
      destacados: lista.filter(n => n.destacado).length,
    };
  });

  noticiasFiltradas = computed(() => {
    let lista = this.noticias();

    if (this.filtroCategoria !== 'todos') {
      lista = lista.filter(n => n.categoria === this.filtroCategoria);
    }
    if (this.filtroEstado === 'publicado') {
      lista = lista.filter(n => n.publicado);
    } else if (this.filtroEstado === 'borrador') {
      lista = lista.filter(n => !n.publicado);
    } else if (this.filtroEstado === 'destacado') {
      lista = lista.filter(n => n.destacado);
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.resumen.toLowerCase().includes(q) ||
        n.categoria.toLowerCase().includes(q)
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

  async cargarDatos(forzar = false) {
    this.cargando.set(true);
    this.error.set(null);
    this.desdeCache.set(false);

    if (!forzar) {
      const cached = this.cache.get<NoticiaDB[]>(CACHE_KEY);
      if (cached) {
        this.noticias.set(cached);
        this.desdeCache.set(true);
        this.cargando.set(false);
        return;
      }
    }

    try {
      const data = await this.supa.getAll<NoticiaDB>('noticias', {
        orderBy: 'fecha_publicacion',
        ascending: false,
      });
      this.noticias.set(data);
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar noticias: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cargando.set(false);
    }
  }

  abrirFormularioCrear() {
    this.modoFormulario = 'crear';
    this.noticiaEditandoId = null;
    this.formulario = this.formularioVacio();
    this.uploadError = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(noticia: NoticiaDB) {
    this.modoFormulario = 'editar';
    this.noticiaEditandoId = noticia.id;
    this.formulario = {
      titulo: noticia.titulo,
      resumen: noticia.resumen,
      contenido: noticia.contenido,
      categoria: noticia.categoria,
      publicado: noticia.publicado,
      destacado: noticia.destacado,
      imagen: null,
      imagenUrlActual: noticia.imagen_url,
    };
    this.uploadError = null;
    this.mostrarFormulario = true;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.noticiaEditandoId = null;
    this.formulario = this.formularioVacio();
    this.uploadError = null;
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formulario.imagen = input.files?.[0] ?? null;
    this.uploadError = null;
  }

  async guardarNoticia() {
    if (!this.formulario.titulo.trim() || !this.formulario.resumen.trim()) {
      this.uploadError = 'El título y el resumen son obligatorios.';
      return;
    }

    this.guardando.set(true);
    this.uploadError = null;

    try {
      let imagenUrl = this.formulario.imagenUrlActual;

      if (this.formulario.imagen) {
        const file = this.formulario.imagen;
        const timestamp = Date.now();
        const nombreSeguro = file.name.replace(/\s+/g, '_');
        const storagePath = `noticias/${timestamp}-${nombreSeguro}`;
        imagenUrl = await this.supa.uploadFile('imagenes', storagePath, file);
      }

      const slug = this.generarSlug(this.formulario.titulo);
      const payload = {
        titulo: this.formulario.titulo.trim(),
        resumen: this.formulario.resumen.trim(),
        contenido: this.formulario.contenido.trim(),
        categoria: this.formulario.categoria,
        publicado: this.formulario.publicado,
        destacado: this.formulario.destacado,
        imagen_url: imagenUrl || null,
        slug,
        fecha_publicacion: new Date().toISOString(),
      };

      if (this.modoFormulario === 'crear') {
        const insertada = await this.supa.insert<NoticiaDB>('noticias', payload as any);
        this.noticias.update(lista => [insertada, ...lista]);
      } else if (this.noticiaEditandoId) {
        const actualizada = await this.supa.update<NoticiaDB>('noticias', this.noticiaEditandoId, payload as any);
        this.noticias.update(lista =>
          lista.map(n => n.id === this.noticiaEditandoId ? actualizada : n)
        );
      }

      this.cache.set(CACHE_KEY, this.noticias(), CACHE_TTL);
      this.cache.invalidate('public_noticias');
      this.cancelarFormulario();
    } catch (e: any) {
      this.uploadError = 'Error al guardar: ' + (e.message || 'Error desconocido');
    } finally {
      this.guardando.set(false);
    }
  }

  async togglePublicado(noticia: NoticiaDB) {
    this.cambiandoEstado.set(noticia.id);
    try {
      const actualizada = await this.supa.update<NoticiaDB>('noticias', noticia.id, {
        publicado: !noticia.publicado,
      } as any);
      this.noticias.update(lista =>
        lista.map(n => n.id === noticia.id ? actualizada : n)
      );
      this.cache.set(CACHE_KEY, this.noticias(), CACHE_TTL);
      this.cache.invalidate('public_noticias');
    } catch (e: any) {
      alert('Error al cambiar estado: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cambiandoEstado.set(null);
    }
  }

  async toggleDestacado(noticia: NoticiaDB) {
    this.cambiandoEstado.set(noticia.id + '-dest');
    try {
      const actualizada = await this.supa.update<NoticiaDB>('noticias', noticia.id, {
        destacado: !noticia.destacado,
      } as any);
      this.noticias.update(lista =>
        lista.map(n => n.id === noticia.id ? actualizada : n)
      );
      this.cache.set(CACHE_KEY, this.noticias(), CACHE_TTL);
      this.cache.invalidate('public_noticias');
    } catch (e: any) {
      alert('Error al cambiar destacado: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cambiandoEstado.set(null);
    }
  }

  async eliminarNoticia(noticia: NoticiaDB) {
    if (!confirm(`¿Eliminar la noticia "${noticia.titulo}"? Esta acción no se puede deshacer.`)) return;

    this.eliminando.set(noticia.id);
    try {
      if (noticia.imagen_url) {
        try {
          const url = new URL(noticia.imagen_url);
          const pathSegments = url.pathname.split('/imagenes/');
          if (pathSegments.length > 1) {
            await this.supa.deleteFile('imagenes', pathSegments[1]);
          }
        } catch {
          // continuar aunque falle la eliminación de imagen
        }
      }
      await this.supa.delete('noticias', noticia.id);
      this.noticias.update(lista => lista.filter(n => n.id !== noticia.id));
      this.cache.set(CACHE_KEY, this.noticias(), CACHE_TTL);
      this.cache.invalidate('public_noticias');
    } catch (e: any) {
      alert('Error al eliminar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.eliminando.set(null);
    }
  }

  etiquetaCategoria(cat: string): string {
    return this.categorias.find(c => c.value === cat)?.label ?? cat;
  }

  private generarSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      + '-' + Date.now();
  }

  private formularioVacio(): FormularioNoticia {
    return {
      titulo: '',
      resumen: '',
      contenido: '',
      categoria: 'noticia',
      publicado: false,
      destacado: false,
      imagen: null,
      imagenUrlActual: null,
    };
  }
}
