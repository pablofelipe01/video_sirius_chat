# Video Sirius Chat

Una plataforma moderna de videollamadas y gestión de reuniones construida con Next.js, TypeScript, Supabase y Stream.io Video SDK.

## 🚀 Características Principales

### 🎥 **Sistema de Videollamadas Completo**
- **Reuniones rápidas** con generación automática de IDs únicos
- **Reuniones programadas** con invitación de participantes internos
- **Unirse por ID** de reunión compartido o link directo
- **Videollamadas multi-usuario** en tiempo real con Stream.io
- **Controles de llamada** integrados (mute, cámara, compartir pantalla)
- **Links compartibles** que funcionan automáticamente en cualquier dominio

### 📅 **Gestión Avanzada de Reuniones**
- **Crear reuniones** con título, descripción, fecha/hora y duración
- **Invitar participantes** del equipo Sirius mediante dropdown
- **Invitar externos** mediante links compartibles
- **Visualizar participantes** en cada reunión
- **Eliminar reuniones** con confirmación de seguridad
- **Dashboard completo** con todas las reuniones del usuario

### 🗄️ **Base de Datos Robusta**
- **PostgreSQL con Supabase** como backend
- **Row Level Security (RLS)** para máxima seguridad
- **Relaciones complejas** entre empleados, reuniones y participantes
- **Políticas de seguridad** para todas las operaciones CRUD
- **Integridad referencial** con foreign keys

### 🎨 **Diseño Glassmorphism Moderno**
- **Efectos de vidrio esmerilado** con `backdrop-blur`
- **Transparencias dinámicas** y bordes suaves
- **Paleta de colores** profesional en tonos oscuros
- **Componentes reutilizables** con Tailwind CSS
- **Totalmente responsive** para todos los dispositivos

### 🔐 **Autenticación y Autorización**
- **Sistema de login** con email y contraseña
- **Protección de rutas** automática
- **Gestión de sesiones** persistente
- **Contexto de autenticación** global

### 📊 **Dashboard Interactivo**
- **Vista unificada** de reuniones programadas y activas
- **Estados visuales** para diferentes tipos de reuniones
- **Navegación intuitiva** entre secciones (Reuniones, Resúmenes, Analíticas)
- **Información detallada** de participantes, duración y fecha
- **Acciones rápidas** para unirse, copiar link, editar y eliminar
- **Gestión completa** de reuniones como host o participante

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ con App Router
- **Lenguaje**: TypeScript con tipado estricto
- **Estilizado**: Tailwind CSS con diseño glassmorphism
- **Video**: Stream.io Video React SDK con transcripción nativa
- **Transcripción**: Stream.io Native Transcription (JSONL parsing)
- **Base de datos**: Supabase PostgreSQL con RLS
- **Autenticación**: Supabase Auth
- **Componentes UI**: Radix UI + Tailwind CSS
- **Iconos**: Lucide React
- **Linting**: ESLint con configuración estricta
- **Package Manager**: npm
- **Deploy**: Vercel (Production: https://video-sirius-chat.vercel.app)

## 📁 Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── dashboard/               # Dashboard principal con gestión de reuniones
│   ├── video-room/[roomId]/     # Páginas dinámicas de videollamadas
│   ├── video-test/              # Página de pruebas de video
│   └── api/                     # API endpoints
│       ├── stream/token/        # Tokens de Stream.io
│       ├── transcription/       # Endpoint de transcripciones
│       └── meetings/[meetingId]/transcription/  # API para ver transcripciones
├── components/                   # Componentes React reutilizables
│   ├── ui/                      # Componentes base (Button, Card, Dialog, etc.)
│   ├── DashboardHeader.tsx      # Header glassmorphism transparente
│   ├── CreateMeetingModal.tsx   # Modal para crear reuniones
│   ├── VideoRoom.tsx            # Componente principal de videollamadas
│   ├── StreamTranscription.tsx  # Transcripción en tiempo real con Stream.io
│   └── TranscriptionViewer.tsx  # Visor de transcripciones completas
├── contexts/                     # Contextos de React
│   └── AuthContext.tsx          # Gestión global de autenticación
├── hooks/                        # Custom hooks
│   └── useStreamVideoClient.ts  # Hook para cliente de Stream.io
├── lib/                         # Utilidades y configuraciones
│   ├── supabase.ts              # Cliente de Supabase
│   └── transcriptionUtils.ts    # Utilidades para parsear JSONL de Stream.io
├── types/                       # Definiciones de tipos TypeScript
│   └── index.ts                 # Tipos de Meeting, Employee, Transcription, etc.
└── database/                    # Scripts y migraciones de base de datos
    ├── setup.sql                # Schema inicial con empleados y reuniones
    ├── migration_001_add_room_id.sql
    ├── migration_002_add_rls_policies.sql
    └── migration_003_add_delete_meeting_policy.sql
```

## 🚀 Configuración e Instalación

### 1. **Clonar el repositorio**
```bash
git clone https://github.com/pablofelipe01/video_sirius_chat.git
cd video_sirius_chat
```

### 2. **Instalar dependencias**
```bash
npm install
```

### 3. **Configurar variables de entorno**
Crear archivo `.env.local` con:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_key

# Stream.io Configuration
NEXT_PUBLIC_STREAM_API_KEY=tu_stream_api_key
STREAM_SECRET_KEY=tu_stream_secret_key
```

### 4. **Ejecutar en desarrollo**
```bash
npm run dev
```

### 5. **Construir para producción**
```bash
npm run build
npm start
```

## 🎯 Cómo Usar la Aplicación

### **Iniciar Sesión**
1. Ve a `https://video-sirius-chat.vercel.app` (o `http://localhost:3000` en desarrollo)
2. Introduce tu cédula y contraseña de empleado
3. Serás redirigido al dashboard principal

### **Crear Reunión Programada**
1. En el dashboard, clic en **"Nueva Reunión"**
2. Completa el formulario:
   - Título y descripción de la reunión
   - Fecha y hora programada
   - Duración en minutos
   - Seleccionar participantes del equipo Sirius
3. La reunión se creará y aparecerá en tu dashboard

### **Crear Reunión Rápida**
1. En el dashboard, clic en **"Reunión Rápida"**
2. Se generará automáticamente un ID único
3. Comparte el ID visible en la interfaz con otros participantes

### **Unirse a Reunión Existente**
1. **Método 1**: En el dashboard, clic en **"Unirse"** en cualquier reunión
2. **Método 2**: Clic en **"Unirse a Reunión"** e introduce el ID
3. **Método 3**: Usar el link compartible que recibiste

### **Gestionar Reuniones**
- **Copiar Link**: Botón "Link" para compartir reunión con externos
- **Editar**: Modificar detalles de la reunión (próximamente)
- **Eliminar**: Botón rojo de basura con confirmación de seguridad
- **Ver Participantes**: Lista completa visible en cada reunión

### **Durante la Videollamada**
- **Copiar ID**: Usa el botón "Copiar" para compartir la reunión
- **Controles**: Mute/unmute, encender/apagar cámara
- **Transcripción en Tiempo Real**: Visualiza la transcripción mientras hablas
- **Salir**: Botón rojo "Salir" para terminar la reunión

### **Ver Transcripciones Guardadas**
1. En el dashboard, busca reuniones que tengan transcripciones
2. Clic en **"Ver Transcripción"** (icono de documento)
3. Visualiza la transcripción completa con:
   - **Vista por Segmentos**: Cada intervención con timestamps
   - **Vista por Hablante**: Agrupado por persona
   - **Búsqueda**: Encuentra texto específico en la transcripción
   - **Exportar**: Descarga la transcripción en formato texto

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Producción
npm run build        # Construir aplicación
npm start            # Ejecutar en producción

# Código
npm run lint         # Verificar ESLint
npm run lint:fix     # Corregir errores de ESLint automáticamente
```

## 🎙️ Sistema de Transcripción Avanzado

### **Transcripción en Tiempo Real**
La aplicación incluye un sistema completo de transcripción que utiliza la tecnología nativa de **Stream.io** para procesar audio sin límites de tamaño de archivo.

#### **Características Principales:**
- ✅ **Sin límites de archivo**: Elimina errores 413 de tamaño de archivo
- ✅ **Tiempo real**: Transcripción instantánea durante la videollamada
- ✅ **Múltiples hablantes**: Identificación automática de participantes
- ✅ **Timestamps precisos**: Cada intervención con hora exacta
- ✅ **Persistencia**: Transcripciones guardadas automáticamente
- ✅ **Interfaz intuitiva**: Visualización clara y organizada

#### **Arquitectura Técnica:**
- **Stream.io Native SDK**: Procesamiento nativo sin servicios externos
- **JSONL Parsing**: Procesamiento personalizado del formato Stream.io
- **Supabase Storage**: Almacenamiento seguro con RLS policies
- **TypeScript Types**: Tipado estricto para TranscriptionSegment
- **API Endpoints**: `/api/transcription` y `/api/meetings/[id]/transcription`

#### **Formatos de Visualización:**
1. **Vista por Segmentos**: Cada intervención individual con timestamp
2. **Vista por Hablante**: Agrupación de intervenciones por persona
3. **Vista Expandible**: Detalles completos de cada segmento
4. **Búsqueda Integrada**: Encuentra texto específico instantáneamente

#### **Componentes del Sistema:**
- `StreamTranscription.tsx`: Transcripción en tiempo real durante videollamadas
- `TranscriptionViewer.tsx`: Interfaz para ver transcripciones completas
- `transcriptionUtils.ts`: Utilidades para parsear y formatear JSONL
- Endpoints API dedicados con permisos de service role

### **Cómo Funciona la Transcripción:**

1. **Durante la Reunión**: El componente `StreamTranscription` se activa automáticamente
2. **Procesamiento**: Stream.io procesa el audio y genera transcripción JSONL
3. **Almacenamiento**: La transcripción se guarda asociada a la reunión
4. **Visualización**: Desde el dashboard, clic en "Ver Transcripción"
5. **Interacción**: Navega entre vistas, busca texto, exporta contenido

```

## 🌟 Características Técnicas Destacadas

### **Sistema de Base de Datos Avanzado**
- **PostgreSQL** con Supabase como BaaS
- **Row Level Security (RLS)** implementado para máxima seguridad
- **Relaciones complejas** entre empleados, reuniones y participantes
- **Políticas granulares** para CREATE, READ, UPDATE, DELETE
- **Migraciones versionadas** para evolución del schema
- **Almacenamiento de transcripciones** con asociación a reuniones

### **Sistema de Transcripción Nativo**
- **Stream.io Native Transcription** sin límites de tamaño de archivo
- **Procesamiento JSONL en tiempo real** con parsing personalizado
- **Agrupación inteligente por hablante** y timestamps precisos
- **API endpoints dedicados** con permisos de service role
- **Interfaz de visualización** con vistas expandibles y búsqueda

### **Gestión de Estado Avanzada**
- **Custom hooks** para Stream.io client management
- **Context API** para autenticación global
- **TypeScript estricto** con interfaces robustas
- **Cleanup automático** de conexiones de video

### **Optimización de Performance**
- **Lazy loading** de componentes de video
- **Optimización de bundles** con Next.js
- **Caching inteligente** de tokens de autenticación
- **Compilación optimizada** sin warnings de ESLint

### **Experiencia de Usuario Superior**
- **Loading states** elegantes durante conexiones
- **Error handling** robusto con mensajes claros
- **Responsive design** para todas las pantallas
- **Glassmorphism UI** con efectos visuales modernos
- **Accesibilidad mejorada** con contrastes apropiados

## 🔮 Roadmap de Funcionalidades

### **✅ Completado (v1.0)**
- [x] Sistema completo de videollamadas con Stream.io
- [x] **Transcripción nativa en tiempo real** con Stream.io
- [x] **Visor de transcripciones** con agrupación por hablante
- [x] **Procesamiento JSONL personalizado** para timestamps precisos
- [x] **API endpoints dedicados** para transcripciones con permisos
- [x] Autenticación de empleados con Supabase
- [x] Dashboard interactivo con gestión de reuniones
- [x] Crear reuniones programadas con participantes
- [x] Invitar empleados internos via dropdown
- [x] Links compartibles para externos
- [x] Base de datos con RLS y relaciones complejas
- [x] UI glassmorphism responsive
- [x] Deploy en producción (Vercel)

### **🚧 Próximas Implementaciones (v1.1)**
- [ ] **Editar reuniones** existentes (modal de edición)
- [ ] **Exportar transcripciones** en múltiples formatos (PDF, DOCX)
- [ ] **Búsqueda avanzada** en transcripciones con filtros
- [ ] **Chat en tiempo real** durante videollamadas
- [ ] **Compartir pantalla** integrado
- [ ] **Notificaciones** de reuniones próximas

### **🔮 Funcionalidades Futuras (v2.0)**
- [ ] **Grabación de reuniones** con almacenamiento
- [ ] **Resúmenes automáticos** de transcripciones con IA
- [ ] **Análisis de sentimiento** en transcripciones
- [ ] **Traducción automática** de transcripciones
- [ ] **Invitaciones por email** automáticas
- [ ] **Calendario integrado** de reuniones
- [ ] **Salas de espera** (waiting rooms)
- [ ] **Backgrounds virtuales** y filtros
- [ ] **Analíticas avanzadas** de uso y participación

### **⚡ Mejoras de Performance (v2.1)**
- [ ] Optimización de calidad de video adaptativa
- [ ] Compresión de video inteligente
- [ ] Reconexión automática robusta
- [ ] Métricas de calidad de llamada en tiempo real

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🚀 Deploy

### **Producción - Vercel**
🌐 **Live Demo**: https://video-sirius-chat.vercel.app

La aplicación está desplegada y funcionando en producción con:
- ✅ **Build optimizado** sin errores de TypeScript/ESLint
- ✅ **Variables de entorno** configuradas
- ✅ **Base de datos** Supabase en producción
- ✅ **Stream.io** configurado para video en tiempo real
- ✅ **Domain automático** para links compartibles

### **Deploy Manual**
```bash
# Deploy a Vercel
npx vercel --prod

# O conectar repositorio GitHub con Vercel para CI/CD automático
```

### **Variables de Entorno en Producción**
Asegúrate de configurar en tu plataforma de deploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STREAM_API_KEY`
- `STREAM_SECRET_KEY`

---

**Desarrollado con ❤️ usando Next.js 15, TypeScript, Supabase y Stream.io**

**Estado del Proyecto**: ✅ **En Producción** - Totalmente funcional en https://video-sirius-chat.vercel.app
