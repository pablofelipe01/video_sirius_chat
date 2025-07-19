# Video Sirius Chat

Una plataforma moderna de videollamadas y gestión de reuniones construida con Next.js, TypeScript y Stream.io Video SDK.

## 🚀 Características Principales

### 🎥 **Sistema de Videollamadas Completo**
- **Reuniones rápidas** con generación automática de IDs únicos
- **Unirse por ID** de reunión compartido
- **Videollamadas multi-usuario** en tiempo real
- **Controles de llamada** integrados (mute, cámara, compartir pantalla)
- **Interfaz responsive** que funciona en desktop y móviles

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
- **Vista unificada** de reuniones programadas y completadas
- **Estados visuales** para diferentes tipos de reuniones
- **Navegación intuitiva** entre secciones
- **Información de participantes** y duración

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ con App Router
- **Lenguaje**: TypeScript con tipado estricto
- **Estilizado**: Tailwind CSS con diseño glassmorphism
- **Video**: Stream.io Video React SDK
- **Autenticación**: Supabase Auth
- **Base de datos**: Supabase PostgreSQL
- **Iconos**: Lucide React
- **Linting**: ESLint con configuración estricta
- **Package Manager**: npm

## 📁 Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── dashboard/               # Dashboard principal
│   ├── video-room/[roomId]/     # Páginas dinámicas de videollamadas
│   ├── video-test/              # Página de pruebas de video
│   └── api/stream/token/        # API endpoints para tokens de Stream.io
├── components/                   # Componentes React reutilizables
│   ├── ui/                      # Componentes base (Button, Card, etc.)
│   ├── DashboardHeader.tsx      # Header glassmorphism transparente
│   └── VideoRoom.tsx            # Componente principal de videollamadas
├── contexts/                     # Contextos de React
│   └── AuthContext.tsx          # Gestión global de autenticación
├── hooks/                        # Custom hooks
│   └── useStreamVideoClient.ts  # Hook para cliente de Stream.io
├── lib/                         # Utilidades y configuraciones
│   └── supabase.ts              # Cliente de Supabase
└── types/                       # Definiciones de tipos TypeScript
    └── index.ts                 # Tipos de Meeting, Employee, etc.
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
1. Ve a `http://localhost:3000`
2. Introduce tus credenciales de empleado
3. Serás redirigido al dashboard principal

### **Crear Reunión Rápida**
1. En el dashboard, clic en **"Reunión Rápida"**
2. Se generará automáticamente un ID único
3. Comparte el ID visible en la interfaz con otros participantes

### **Unirse a Reunión Existente**
1. En el dashboard, clic en **"Unirse a Reunión"**
2. Introduce el ID de reunión compartido
3. Serás conectado automáticamente a la videollamada

### **Durante la Videollamada**
- **Copiar ID**: Usa el botón "Copiar" para compartir la reunión
- **Controles**: Mute/unmute, encender/apagar cámara
- **Salir**: Botón rojo "Salir" para terminar la reunión

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

## 🌟 Características Técnicas Destacadas

### **Gestión de Estado Avanzada**
- **Custom hooks** para Stream.io client management
- **Context API** para autenticación global
- **Cleanup automático** de conexiones de video

### **Optimización de Performance**
- **Lazy loading** de componentes de video
- **Optimización de bundles** con Next.js
- **Caching inteligente** de tokens de autenticación

### **Experiencia de Usuario**
- **Loading states** elegantes durante conexiones
- **Error handling** robusto con mensajes claros
- **Responsive design** para todas las pantallas
- **Keyboard shortcuts** para controles de video

## 🔮 Roadmap de Funcionalidades

### **Próximas Implementaciones**
- [ ] Chat en tiempo real durante videollamadas
- [ ] Compartir pantalla integrado
- [ ] Grabación de reuniones
- [ ] Invitaciones por email
- [ ] Calendario de reuniones programadas
- [ ] Salas de espera (waiting rooms)
- [ ] Backgrounds virtuales
- [ ] Notificaciones push

### **Mejoras de Performance**
- [ ] Optimización de calidad de video adaptativa
- [ ] Compresión de video inteligente
- [ ] Reconexión automática
- [ ] Métricas de calidad de llamada

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🚀 Deploy

### **Vercel (Recomendado)**
```bash
npx vercel --prod
```

### **Variables de Entorno en Producción**
Asegúrate de configurar todas las variables de entorno en tu plataforma de deploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `NEXT_PUBLIC_STREAM_API_KEY`
- `STREAM_SECRET_KEY`

---

**Desarrollado con ❤️ usando Next.js, TypeScript y Stream.io**
