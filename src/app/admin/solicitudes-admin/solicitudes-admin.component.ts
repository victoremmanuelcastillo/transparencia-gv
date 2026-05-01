import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';

const ADMIN_CACHE_KEY = 'admin_solicitudes';
const CACHE_TTL = 60 * 1000;

type EstatusSolicitud = 'recibida' | 'en_proceso' | 'respondida' | 'cerrada';

interface SolicitudARCO {
  id: string;
  folio: string;
  tipo: 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';
  solicitante: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  descripcion: string;
  estatus: EstatusSolicitud;
  respuesta: string | null;
  fecha_creacion: string;
  fecha_respuesta: string | null;
  fecha_limite: string;
  created_at: string;
}

@Component({
  selector: 'app-solicitudes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-admin.component.html',
  styleUrl: './solicitudes-admin.component.css',
})
export class SolicitudesAdminComponent implements OnInit {
  private supa: SupabaseService;
  private cache: CacheService;

  solicitudes = signal<SolicitudARCO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = '';
  filtroEstatus: string = 'todos';
  solicitudSeleccionada: SolicitudARCO | null = null;
  respuestaTexto = '';

  filtrosEstatus = [
    { label: 'Todas', value: 'todos' },
    { label: 'Recibidas', value: 'recibida' },
    { label: 'En proceso', value: 'en_proceso' },
    { label: 'Respondidas', value: 'respondida' },
    { label: 'Cerradas', value: 'cerrada' },
  ];

  conteo = computed(() => {
    const s = this.solicitudes();
    return {
      total: s.length,
      recibida: s.filter(x => x.estatus === 'recibida').length,
      en_proceso: s.filter(x => x.estatus === 'en_proceso').length,
      respondida: s.filter(x => x.estatus === 'respondida').length,
      cerrada: s.filter(x => x.estatus === 'cerrada').length,
    };
  });

  solicitudesFiltradas = computed(() => {
    let lista = this.solicitudes();
    if (this.filtroEstatus !== 'todos') {
      lista = lista.filter(s => s.estatus === (this.filtroEstatus as EstatusSolicitud));
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(s =>
        s.folio?.toLowerCase().includes(q) ||
        s.solicitante?.nombre?.toLowerCase().includes(q) ||
        s.solicitante?.email?.toLowerCase().includes(q) ||
        s.descripcion?.toLowerCase().includes(q)
      );
    }
    return lista;
  });

  tipoLabels: Record<string, string> = {
    acceso: 'Acceso',
    rectificacion: 'Rectificación',
    cancelacion: 'Cancelación',
    oposicion: 'Oposición',
  };

  estatusLabels: Record<EstatusSolicitud, string> = {
    recibida: 'Recibida',
    en_proceso: 'En proceso',
    respondida: 'Respondida',
    cerrada: 'Cerrada',
  };

  diasRestantes(fechaLimite: string): number {
    const limite = new Date(fechaLimite);
    const hoy = new Date();
    return Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

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

    const cached = this.cache.get<SolicitudARCO[]>(ADMIN_CACHE_KEY);
    if (cached) {
      this.solicitudes.set(cached);
      this.cargando.set(false);
      return;
    }

    try {
      const data = await this.supa.getAll<SolicitudARCO>('solicitudes_arco', {
        orderBy: 'created_at',
        ascending: false,
      });
      this.solicitudes.set(data);
      this.cache.set(ADMIN_CACHE_KEY, data, CACHE_TTL);
    } catch (e: any) {
      this.error.set('Error al cargar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.cargando.set(false);
    }
  }

  private invalidarCache() {
    this.cache.invalidate(ADMIN_CACHE_KEY);
  }

  abrirDetalle(s: SolicitudARCO) {
    this.solicitudSeleccionada = s;
    this.respuestaTexto = s.respuesta ?? '';
  }

  cerrarDetalle() {
    this.solicitudSeleccionada = null;
    this.respuestaTexto = '';
  }

  async cambiarEstatus(s: SolicitudARCO, nuevoEstatus: EstatusSolicitud) {
    try {
      await this.supa.update('solicitudes_arco', s.id, { estatus: nuevoEstatus } as any);
      this.solicitudes.update(lista =>
        lista.map(x => x.id === s.id ? { ...x, estatus: nuevoEstatus } : x)
      );
      if (this.solicitudSeleccionada?.id === s.id) {
        this.solicitudSeleccionada = { ...this.solicitudSeleccionada, estatus: nuevoEstatus };
      }
      this.invalidarCache();
    } catch (e: any) {
      alert('Error al cambiar estatus: ' + (e.message || 'Error desconocido'));
    }
  }

  async guardarRespuesta() {
    if (!this.solicitudSeleccionada || !this.respuestaTexto.trim()) return;
    this.guardando.set(true);
    try {
      const ahora = new Date().toISOString();
      await this.supa.update('solicitudes_arco', this.solicitudSeleccionada.id, {
        respuesta: this.respuestaTexto.trim(),
        estatus: 'respondida' as EstatusSolicitud,
        fecha_respuesta: ahora,
      } as any);
      this.solicitudes.update(lista =>
        lista.map(x =>
          x.id === this.solicitudSeleccionada!.id
            ? { ...x, respuesta: this.respuestaTexto.trim(), estatus: 'respondida' as EstatusSolicitud, fecha_respuesta: ahora }
            : x
        )
      );
      this.solicitudSeleccionada = {
        ...this.solicitudSeleccionada,
        respuesta: this.respuestaTexto.trim(),
        estatus: 'respondida',
        fecha_respuesta: ahora,
      };
      this.invalidarCache();
    } catch (e: any) {
      alert('Error al guardar respuesta: ' + (e.message || 'Error desconocido'));
    } finally {
      this.guardando.set(false);
    }
  }
}
