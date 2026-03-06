# Plataforma de Transparencia Municipal

**H. Ayuntamiento de Guadalupe Victoria, Durango** · Gobierno Municipal 2025-2028

## Stack Tecnológico

| Componente | Tecnología | Plan |
|---|---|---|
| Frontend | Angular 21 | — |
| Hosting Web | Vercel | Gratuito |
| Base de Datos | Supabase (PostgreSQL) | Gratuito |
| Imágenes | ImgBB API | Gratuito |
| Chatbot IA | DeepSeek | ~$50 USD/año |
| Dominio | .gob.mx vía Akky | ~$330 MXN/año |

## Estructura del Proyecto

```
src/app/
├── core/                    # Servicios singleton, guards, modelos
│   ├── guards/auth.guard.ts
│   ├── models/index.ts      # Todas las interfaces TypeScript
│   └── services/            # Supabase, Auth, ImgBB, Chatbot, ARCO, Alertas
├── shared/components/       # Header, Footer, Loading
├── layouts/                 # PublicLayout, AdminLayout
├── public/                  # 11 secciones ciudadanas
│   ├── home/ transparencia/ informes/ programas-sociales/
│   ├── directorio/ solicitudes-arco/ noticias/
│   └── marco-normativo/ tramites/ aviso-privacidad/
└── admin/                   # 10 secciones de administración
    ├── login/ dashboard/ transparencia-admin/
    ├── informes-admin/ noticias-admin/ directorio-admin/
    └── programas-admin/ solicitudes-admin/ tramites-admin/ configuracion/
```

## Setup Rápido

```bash
npm install
# Configurar environment.ts con keys de Supabase + ImgBB
# Ejecutar supabase/schema.sql en Supabase SQL Editor
ng serve         # Desarrollo local en localhost:4200
vercel           # Deploy a producción
```

## Características Principales

- 48 fracciones Art. 70 LGTAIP pre-cargadas
- Solicitudes ARCO con folio automático
- Chatbot IA ciudadano (DeepSeek)
- Panel admin intuitivo (sin conocimiento técnico)
- Compresión automática de imágenes
- Alertas de vencimiento por email
- Lazy loading + RLS en toda la base de datos
