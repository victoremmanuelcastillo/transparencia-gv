import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SolicitudArco, DatosSolicitante } from '../models';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Genera folio automático: ARCO-2026-0001
   */
  private async generarFolio(): Promise<string> {
    const anio = new Date().getFullYear();
    const { data } = await this.supabase.client
      .from('solicitudes_arco')
      .select('folio')
      .like('folio', `ARCO-${anio}-%`)
      .order('folio', { ascending: false })
      .limit(1);

    const ultimoNumero = data?.[0]
      ? parseInt(data[0].folio.split('-')[2]) : 0;
    const nuevoNumero = String(ultimoNumero + 1).padStart(4, '0');
    return `ARCO-${anio}-${nuevoNumero}`;
  }

  async crearSolicitud(
    tipo: SolicitudArco['tipo'],
    solicitante: DatosSolicitante,
    descripcion: string,
  ): Promise<SolicitudArco> {
    const folio = await this.generarFolio();
    const ahora = new Date();

    // 20 días hábiles ≈ 28 días calendario
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() + 28);

    const solicitud: Partial<SolicitudArco> = {
      folio,
      tipo,
      solicitante,
      descripcion,
      estatus: 'recibida',
      documentosAdjuntos: [],
      fechaCreacion: ahora,
      fechaLimite,
    };

    return this.supabase.insert<SolicitudArco>('solicitudes_arco', solicitud);
  }

  async obtenerPorFolio(folio: string): Promise<SolicitudArco | null> {
    const { data } = await this.supabase.client
      .from('solicitudes_arco')
      .select('*')
      .eq('folio', folio)
      .single();
    return data;
  }

  async listarSolicitudes(filtros?: { estatus?: string }): Promise<SolicitudArco[]> {
    return this.supabase.getAll<SolicitudArco>('solicitudes_arco', {
      orderBy: 'fechaCreacion',
      ascending: false,
      filters: filtros,
    });
  }

  async responderSolicitud(id: string, respuesta: string): Promise<void> {
    await this.supabase.update('solicitudes_arco', id, {
      respuesta,
      estatus: 'respondida',
      fechaRespuesta: new Date(),
    });
  }
}
