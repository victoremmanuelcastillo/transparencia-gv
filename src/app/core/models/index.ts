// ============================================
// MODELOS DE DATOS — Plataforma de Transparencia
// H. Ayuntamiento de Guadalupe Victoria
// ============================================

// --- TRANSPARENCIA (48 Fracciones Art. 70) ---
export interface Fraccion {
  id: string;
  numero: number;          // 1-48
  titulo: string;
  descripcion: string;
  documentos: Documento[];
  ultimaActualizacion: Date;
  estatus: 'vigente' | 'pendiente' | 'vencido';
}

export interface Documento {
  id: string;
  titulo: string;
  archivoUrl: string;       // URL del PDF/Excel en Supabase Storage
  tipo: 'pdf' | 'xlsx' | 'docx' | 'imagen';
  tamanio: number;           // bytes
  fraccionId?: string;
  categoriaId?: string;
  anio: number;
  trimestre?: 1 | 2 | 3 | 4;
  fechaPublicacion: Date;
  fechaActualizacion: Date;
  creadoPor: string;         // userId
}

// --- DIRECTORIO DE FUNCIONARIOS ---
export interface Funcionario {
  id: string;
  nombre: string;
  cargo: string;
  area: string;
  telefono: string;
  email: string;
  fotoUrl?: string;          // URL de ImgBB
  declaracionUrl?: string;   // URL de declaración patrimonial
  orden: number;
  activo: boolean;
}

// --- NOTICIAS Y AVISOS ---
export interface Noticia {
  id: string;
  titulo: string;
  contenido: string;         // HTML del editor
  resumen: string;
  imagenUrl?: string;        // URL de ImgBB
  galeria: string[];         // URLs adicionales
  categoria: 'noticia' | 'aviso' | 'comunicado';
  fechaPublicacion: Date;
  fechaProgramada?: Date;
  publicado: boolean;
  destacado: boolean;
  slug: string;
  creadoPor: string;
}

// --- PROGRAMAS SOCIALES ---
export interface ProgramaSocial {
  id: string;
  nombre: string;
  descripcion: string;
  beneficiarios: string;
  requisitos: string;
  presupuesto: number;
  imagenUrl?: string;
  evidencias: string[];      // URLs de imágenes de evidencia
  periodo: string;
  estatus: 'activo' | 'finalizado' | 'en_proceso';
  fechaInicio: Date;
  fechaFin?: Date;
}

// --- SOLICITUDES ARCO ---
export interface SolicitudArco {
  id: string;
  folio: string;             // Auto-generado: ARCO-2026-0001
  tipo: 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';
  solicitante: DatosSolicitante;
  descripcion: string;
  documentosAdjuntos: string[];
  estatus: 'recibida' | 'en_proceso' | 'respondida' | 'cerrada';
  respuesta?: string;
  fechaCreacion: Date;
  fechaRespuesta?: Date;
  fechaLimite: Date;         // 20 días hábiles por ley
  asignadoA?: string;
}

export interface DatosSolicitante {
  nombre: string;
  email: string;
  telefono?: string;
  tipoIdentificacion?: string;
}

// --- INFORMES Y REPORTES ---
export interface Informe {
  id: string;
  titulo: string;
  tipo: 'trimestral' | 'anual' | 'auditoria' | 'financiero' | 'especial';
  archivoUrl: string;
  anio: number;
  trimestre?: 1 | 2 | 3 | 4;
  fechaPublicacion: Date;
  descripcion?: string;
}

// --- MARCO NORMATIVO ---
export interface MarcoNormativo {
  id: string;
  titulo: string;
  categoria: 'ley' | 'reglamento' | 'codigo' | 'manual' | 'lineamiento' | 'acuerdo';
  archivoUrl: string;
  fechaPublicacion: Date;
  vigente: boolean;
  descripcion?: string;
}

// --- TRÁMITES Y SERVICIOS ---
export interface Tramite {
  id: string;
  nombre: string;
  descripcion: string;
  requisitos: string;
  costo: string;             // "Gratuito" o "$xxx MXN"
  tiempoRespuesta: string;   // "5 días hábiles"
  formatoUrl?: string;       // PDF descargable
  area: string;
  horario: string;
  ubicacion: string;
}

// --- USUARIOS / AUTH ---
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'editor';
  avatar?: string;
  activo: boolean;
  ultimoAcceso?: Date;
}

// --- CONFIGURACIÓN DEL SITIO ---
export interface ConfigSitio {
  id: string;
  bannerPrincipal: string[];  // URLs de imágenes del carousel
  mensajeBienvenida: string;
  telefonoContacto: string;
  emailContacto: string;
  direccion: string;
  redesSociales: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  horarioAtencion: string;
  avisoPrivacidad: string;    // HTML
  escudoUrl: string;
}

// --- ESTADÍSTICAS DASHBOARD ---
export interface EstadisticasDashboard {
  visitasMes: number;
  solicitudesPendientes: number;
  documentosSubidos: number;
  fraccionesVigentes: number;
  fraccionesPendientes: number;
  ultimaActualizacion: Date;
}

// --- ALERTAS DE VENCIMIENTO ---
export interface Alerta {
  id: string;
  tipo: 'vencimiento' | 'solicitud' | 'sistema';
  mensaje: string;
  fraccionId?: string;
  solicitudId?: string;
  fechaLimite?: Date;
  leida: boolean;
  fechaCreacion: Date;
}
