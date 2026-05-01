-- ============================================
-- SCHEMA SQL — Plataforma de Transparencia
-- H. Ayuntamiento de Guadalupe Victoria
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================
-- USUARIOS (admin/editor)
-- ==================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'editor' CHECK (rol IN ('admin', 'editor')),
  avatar TEXT,
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios visibles para autenticados" ON usuarios
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Solo admin puede modificar usuarios" ON usuarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- ==================
-- FRACCIONES DE TRANSPARENCIA (Art. 70)
-- ==================
CREATE TABLE fracciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero INT NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 48),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estatus TEXT DEFAULT 'pendiente' CHECK (estatus IN ('vigente', 'pendiente', 'vencido')),
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fracciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fracciones públicas" ON fracciones FOR SELECT USING (true);
CREATE POLICY "Admin gestiona fracciones" ON fracciones
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- DOCUMENTOS
-- ==================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  tipo TEXT DEFAULT 'pdf' CHECK (tipo IN ('pdf', 'xlsx', 'docx', 'imagen')),
  tamanio INT DEFAULT 0,
  fraccion_id UUID REFERENCES fracciones(id) ON DELETE SET NULL,
  categoria_id UUID,
  anio INT NOT NULL,
  trimestre INT CHECK (trimestre BETWEEN 1 AND 4),
  fecha_publicacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  creado_por UUID REFERENCES usuarios(id)
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documentos públicos" ON documentos FOR SELECT USING (true);
CREATE POLICY "Auth gestiona documentos" ON documentos
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- DIRECTORIO DE FUNCIONARIOS
-- ==================
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cargo TEXT NOT NULL,
  area TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  foto_url TEXT,
  declaracion_url TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funcionarios públicos" ON funcionarios FOR SELECT USING (true);
CREATE POLICY "Auth gestiona funcionarios" ON funcionarios
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- NOTICIAS Y AVISOS
-- ==================
CREATE TABLE noticias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  contenido TEXT,
  resumen TEXT,
  imagen_url TEXT,
  galeria TEXT[] DEFAULT '{}',
  categoria TEXT DEFAULT 'noticia' CHECK (categoria IN ('noticia', 'aviso', 'comunicado')),
  fecha_publicacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_programada TIMESTAMPTZ,
  publicado BOOLEAN DEFAULT false,
  destacado BOOLEAN DEFAULT false,
  slug TEXT UNIQUE NOT NULL,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Noticias publicadas son públicas" ON noticias
  FOR SELECT USING (publicado = true OR auth.role() = 'authenticated');
CREATE POLICY "Auth gestiona noticias" ON noticias
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- PROGRAMAS SOCIALES
-- ==================
CREATE TABLE programas_sociales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  beneficiarios TEXT,
  requisitos TEXT,
  presupuesto DECIMAL(12,2) DEFAULT 0,
  imagen_url TEXT,
  evidencias TEXT[] DEFAULT '{}',
  periodo TEXT,
  estatus TEXT DEFAULT 'activo' CHECK (estatus IN ('activo', 'finalizado', 'en_proceso')),
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE programas_sociales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programas públicos" ON programas_sociales FOR SELECT USING (true);
CREATE POLICY "Auth gestiona programas" ON programas_sociales
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- SOLICITUDES ARCO
-- ==================
CREATE TABLE solicitudes_arco (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('acceso', 'rectificacion', 'cancelacion', 'oposicion')),
  solicitante JSONB NOT NULL,
  descripcion TEXT NOT NULL,
  documentos_adjuntos TEXT[] DEFAULT '{}',
  estatus TEXT DEFAULT 'recibida' CHECK (estatus IN ('recibida', 'en_proceso', 'respondida', 'cerrada')),
  respuesta TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_respuesta TIMESTAMPTZ,
  fecha_limite TIMESTAMPTZ NOT NULL,
  asignado_a UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE solicitudes_arco ENABLE ROW LEVEL SECURITY;
-- Los ciudadanos solo pueden ver sus propias solicitudes por folio (vía función RPC)
CREATE POLICY "Admin ve todas las solicitudes" ON solicitudes_arco
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Ciudadanos pueden crear solicitudes" ON solicitudes_arco
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth gestiona solicitudes" ON solicitudes_arco
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ==================
-- INFORMES Y REPORTES
-- ==================
CREATE TABLE informes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('trimestral', 'anual', 'auditoria', 'financiero', 'especial')),
  archivo_url TEXT NOT NULL,
  anio INT NOT NULL,
  trimestre INT CHECK (trimestre BETWEEN 1 AND 4),
  fecha_publicacion TIMESTAMPTZ DEFAULT NOW(),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE informes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Informes públicos" ON informes FOR SELECT USING (true);
CREATE POLICY "Auth gestiona informes" ON informes
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- MARCO NORMATIVO
-- ==================
CREATE TABLE marco_normativo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ley', 'reglamento', 'codigo', 'manual', 'lineamiento', 'acuerdo')),
  archivo_url TEXT NOT NULL,
  fecha_publicacion TIMESTAMPTZ DEFAULT NOW(),
  vigente BOOLEAN DEFAULT true,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marco_normativo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marco normativo público" ON marco_normativo FOR SELECT USING (true);
CREATE POLICY "Auth gestiona marco" ON marco_normativo
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- TRÁMITES Y SERVICIOS
-- ==================
CREATE TABLE tramites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  requisitos TEXT,
  costo TEXT DEFAULT 'Gratuito',
  tiempo_respuesta TEXT,
  formato_url TEXT,
  area TEXT,
  horario TEXT,
  ubicacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tramites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trámites públicos" ON tramites FOR SELECT USING (true);
CREATE POLICY "Auth gestiona trámites" ON tramites
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- ALERTAS
-- ==================
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('vencimiento', 'solicitud', 'sistema')),
  mensaje TEXT NOT NULL,
  fraccion_id UUID REFERENCES fracciones(id),
  solicitud_id UUID REFERENCES solicitudes_arco(id),
  fecha_limite TIMESTAMPTZ,
  leida BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth ve alertas" ON alertas
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- CONFIGURACIÓN DEL SITIO
-- ==================
CREATE TABLE config_sitio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_principal TEXT[] DEFAULT '{}',
  mensaje_bienvenida TEXT DEFAULT '',
  telefono_contacto TEXT DEFAULT '',
  email_contacto TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  redes_sociales JSONB DEFAULT '{}',
  horario_atencion TEXT DEFAULT '',
  aviso_privacidad TEXT DEFAULT '',
  escudo_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE config_sitio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config pública" ON config_sitio FOR SELECT USING (true);
CREATE POLICY "Admin gestiona config" ON config_sitio
  FOR ALL USING (auth.role() = 'authenticated');

-- ==================
-- RPC: Buscar solicitud por folio (para ciudadanos)
-- ==================
CREATE OR REPLACE FUNCTION buscar_solicitud_por_folio(p_folio TEXT)
RETURNS TABLE (
  folio TEXT,
  tipo TEXT,
  estatus TEXT,
  fecha_creacion TIMESTAMPTZ,
  fecha_limite TIMESTAMPTZ,
  respuesta TEXT,
  fecha_respuesta TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT s.folio, s.tipo, s.estatus, s.fecha_creacion,
           s.fecha_limite, s.respuesta, s.fecha_respuesta
    FROM solicitudes_arco s
    WHERE s.folio = p_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- SEED: Insertar las 48 fracciones base
-- ==================
INSERT INTO fracciones (numero, titulo) VALUES
(1, 'Marco normativo aplicable'),
(2, 'Estructura orgánica'),
(3, 'Facultades de cada área'),
(4, 'Metas y objetivos'),
(5, 'Indicadores de interés público'),
(6, 'Indicadores de gestión'),
(7, 'Directorio de funcionarios'),
(8, 'Remuneración mensual'),
(9, 'Gastos de representación y viáticos'),
(10, 'Plazas vacantes'),
(11, 'Contrataciones de personal'),
(12, 'Declaraciones patrimoniales'),
(13, 'Domicilio y datos de contacto'),
(14, 'Convocatorias'),
(15, 'Subsidios y programas'),
(16, 'Condiciones generales de trabajo'),
(17, 'Información curricular'),
(18, 'Sanciones administrativas'),
(19, 'Servicios que ofrece'),
(20, 'Trámites, requisitos y formatos'),
(21, 'Presupuesto asignado'),
(22, 'Deuda pública'),
(23, 'Programas operativos anuales'),
(24, 'Resultados de auditorías'),
(25, 'Dictámenes de estados financieros'),
(26, 'Asignación por obra pública'),
(27, 'Concesiones y permisos'),
(28, 'Resultados de procedimientos'),
(29, 'Concesiones y licencias'),
(30, 'Estadísticas generadas'),
(31, 'Informe de avance financiero'),
(32, 'Padrón de proveedores'),
(33, 'Convenios celebrados'),
(34, 'Inventario de bienes'),
(35, 'Recomendaciones de DDHH'),
(36, 'Resoluciones y laudos'),
(37, 'Mecanismos de participación'),
(38, 'Programas federales'),
(39, 'Actas y minutas'),
(40, 'Evaluaciones y encuestas'),
(41, 'Estudios financiados'),
(42, 'Listado de jubilados'),
(43, 'Ingresos recibidos'),
(44, 'Donaciones'),
(45, 'Catálogo documental'),
(46, 'Actas de sesiones'),
(47, 'Opiniones y recomendaciones CONAC'),
(48, 'Otras obligaciones');

-- Insertar configuración inicial
INSERT INTO config_sitio (mensaje_bienvenida, email_contacto, direccion)
VALUES (
  'Bienvenido al Portal de Transparencia del H. Ayuntamiento de Guadalupe Victoria, Durango.',
  'transparencia@guadalupevictoria.gob.mx',
  'Palacio Municipal, Guadalupe Victoria, Durango, México'
);

-- ==================
-- STORAGE BUCKETS
-- ==================
-- Ejecutar en Supabase Dashboard → Storage:
-- 1. Crear bucket: "documentos" (público)
-- 2. Crear bucket: "archivos-arco" (privado)
