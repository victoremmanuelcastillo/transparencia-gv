import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const CACHE_KEY = 'admin_informes';
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
  created_at: string;
}

interface NuevoInforme {
  titulo: string;
  tipo: InformeDB['tipo'];
  anio: number;
  trimestre: number | null;
  descripcion: string;
  archivo: File | null;
}

@Component({
  selector: 'app-informes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes-admin.component.html',
  styleUrl: './informes-admin.component.css',
})
export class InformesAdminComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  informes = signal<InformeDB[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  eliminando = signal<string | null>(null);
  desdeCache = signal(false);

  mostrarFormulario = false;
  busqueda = '';
  filtroTipo = 'todos';
  filtroAnio = 'todos';
  uploadError: string | null = null;

  nuevoInforme: NuevoInforme = this.formVacio();

  readonly tiposInforme: { label: string; value: InformeDB['tipo'] }[] = [
    { label: 'Trimestral', value: 'trimestral' },
    { label: 'Anual', value: 'anual' },
    { label: 'Auditoría', value: 'auditoria' },
    { label: 'Financiero', value: 'financiero' },
    { label: 'Especial', value: 'especial' },
  ];

  readonly filtrosTipo = [
    { label: 'Todos', value: 'todos' },
    { label: 'Trimestral', value: 'trimestral' },
    { label: 'Anual', value: 'anual' },
    { label: 'Auditoría', value: 'auditoria' },
    { label: 'Financiero', value: 'financiero' },
    { label: 'Especial', value: 'especial' },
  ];

  aniosDisponibles = computed(() => {
    const anios = [...new Set(this.informes().map(i => i.anio))].sort((a, b) => b - a);
    return anios;
  });

  conteo = computed(() => {
    const lista = this.informes();
    return {
      total: lista.length,
      trimestral: lista.filter(i => i.tipo === 'trimestral').length,
      anual: lista.filter(i => i.tipo === 'anual').length,
      auditoria: lista.filter(i => i.tipo === 'auditoria').length,
      financiero: lista.filter(i => i.tipo === 'financiero').length,
      especial: lista.filter(i => i.tipo === 'especial').length,
    };
  });

  informesFiltrados = computed(() => {
    let lista = this.informes();

    if (this.filtroTipo !== 'todos') {
      lista = lista.filter(i => i.tipo === this.filtroTipo);
    }
    if (this.filtroAnio !== 'todos') {
      lista = lista.filter(i => i.anio === +this.filtroAnio);
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(i =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(q)) ||
        i.anio.toString().includes(q)
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
      const cached = this.cache.get<InformeDB[]>(CACHE_KEY);
      if (cached) {
        this.informes.set(cached);
        this.desdeCache.set(true);
        this.cargando.set(false);
        return;
      }
    }

    try {
      const data = await this.supa.getAll<InformeDB>('informes', {
        orderBy: 'fecha_publicacion',
        ascending: false,
      });
      this.informes.set(data);
      this.cache.set(CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar informes: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cargando.set(false);
    }
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    this.nuevoInforme.archivo = input.files?.[0] ?? null;
    this.uploadError = null;
  }

  async guardarInforme() {
    if (!this.nuevoInforme.titulo || !this.nuevoInforme.archivo) {
      this.uploadError = 'El título y el archivo son obligatorios.';
      return;
    }

    this.guardando.set(true);
    this.uploadError = null;

    try {
      const file = this.nuevoInforme.archivo;
      const timestamp = Date.now();
      const nombreSeguro = file.name.replace(/\s+/g, '_');
      const storagePath = `${this.nuevoInforme.tipo}/${this.nuevoInforme.anio}/${timestamp}-${nombreSeguro}`;

      const archivoUrl = await this.supa.uploadFile('informes', storagePath, file);

      const insertado = await this.supa.insert<InformeDB>('informes', {
        titulo: this.nuevoInforme.titulo,
        tipo: this.nuevoInforme.tipo,
        archivo_url: archivoUrl,
        anio: this.nuevoInforme.anio,
        trimestre: this.nuevoInforme.trimestre || null,
        descripcion: this.nuevoInforme.descripcion || null,
        fecha_publicacion: new Date().toISOString(),
      } as any);

      this.informes.update(lista => [insertado, ...lista]);
      this.cache.set(CACHE_KEY, this.informes(), CACHE_TTL);
      // Invalidar caché pública para que el usuario vea el nuevo informe
      this.cache.invalidate('public_informes');
      this.nuevoInforme = this.formVacio();
      this.mostrarFormulario = false;

      const fileInput = document.getElementById('archivo-informe') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (e: any) {
      this.uploadError = 'Error al guardar: ' + (e.message || 'Error desconocido');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarInforme(informe: InformeDB) {
    if (!confirm(`¿Eliminar el informe "${informe.titulo}"? Esta acción no se puede deshacer.`)) return;

    this.eliminando.set(informe.id);
    try {
      const url = new URL(informe.archivo_url);
      const pathSegments = url.pathname.split('/informes/');
      if (pathSegments.length > 1) {
        await this.supa.deleteFile('informes', pathSegments[1]);
      }
      await this.supa.delete('informes', informe.id);
      this.informes.update(lista => lista.filter(i => i.id !== informe.id));
      this.cache.set(CACHE_KEY, this.informes(), CACHE_TTL);
      this.cache.invalidate('public_informes');
    } catch (e: any) {
      alert('Error al eliminar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.eliminando.set(null);
    }
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.nuevoInforme = this.formVacio();
    this.uploadError = null;
  }

  etiquetaTipo(tipo: string): string {
    return this.tiposInforme.find(t => t.value === tipo)?.label ?? tipo;
  }

  anioActual(): number {
    return new Date().getFullYear();
  }

  private formVacio(): NuevoInforme {
    return {
      titulo: '',
      tipo: 'trimestral',
      anio: new Date().getFullYear(),
      trimestre: null,
      descripcion: '',
      archivo: null,
    };
  }
}
