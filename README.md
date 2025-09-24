# FFFinanzas 🍟💰

Una aplicación web moderna para la gestión financiera inteligente de negocios de comida rápida, desarrollada con Next.js 15, Supabase y IA de Google Gemini (Genkit).

## ✨ Características Principales

### 🏪 Gestión Completa del Negocio
- **Dashboard Inteligente**: Visualización en tiempo real de ingresos, gastos y métricas clave
- **Gestión de Ventas**: Registro y seguimiento de ventas con productos personalizables  
- **Control de Gastos**: Categorización automática y seguimiento de gastos operacionales
- **Análisis Financiero**: Reportes detallados y gráficos de tendencias

### 🤖 Inteligencia Artificial Integrada
- **Consejos Financieros con Gemini Pro**: Análisis automatizado de datos financieros
- **Distribución de Ganancias**: Recomendaciones IA para distribución entre socios
- **Predicciones de Negocio**: Insights personalizados para el contexto peruano de comida rápida
- **Análisis Contextual**: Consejos específicos basados en patrones de tu negocio

### 🔐 Sistema de Usuarios y Seguridad
- **Autenticación Segura**: Sistema de usuarios con roles (Socios y Superadmin)
- **Row Level Security**: Protección de datos a nivel de base de datos
- **Auditoría Completa**: Registro de todas las acciones del sistema

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez  
- **Tailwind CSS** - Diseño moderno y responsive
- **Radix UI** - Componentes accesibles y customizables
- **React Hook Form + Zod** - Validación de formularios type-safe
- **Recharts** - Visualización de datos interactiva

### Backend
- **Supabase** - Backend-as-a-Service con PostgreSQL
- **Row Level Security** - Seguridad a nivel de base de datos
- **Real-time subscriptions** - Actualizaciones en tiempo real

### Inteligencia Artificial
- **Google Gemini 1.5 (Flash)** - IA para análisis financiero
- **Google AI Genkit** - Framework para integración de IA en el servidor
- **Prompts Especializados** - Contexto específico para negocios peruanos

## 🚀 Configuración del Proyecto

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- API Key de Google Gemini Pro

### Variables de Entorno
Crear archivo `.env.local` (y en producción configúralas en tu proveedor de hosting):

```env
# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI Genkit (solo servidor)
GOOGLE_GENKIT_API_KEY=your_google_genkit_api_key
```

### Instalación

```bash
# Clonar el repositorio
git clone [repository-url]
cd FFFinazas

# Instalar dependencias
npm install

# Configurar base de datos en Supabase
# Ejecutar el script SQL incluido en: /sql/reset_schema.sql

# Ejecutar en modo desarrollo
npm run dev
```

### Configuración de Supabase

1. **Crear proyecto en Supabase**
2. **Ejecutar el schema SQL** incluido en `sql/reset_schema.sql`
3. **Configurar Row Level Security** (ya incluido en el schema)
4. **Obtener las credenciales** del proyecto

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **users** - Gestión de usuarios y roles
- **products** - Catálogo de productos del negocio
- **distribution_types** - Tipos de distribución (para la calculadora de socios)
- **sales** - Registro de ventas realizadas  
- **expenses** - Control de gastos operacionales
- **expense_categories** - Categorización de gastos
- **audit_logs** - Registro de auditoría del sistema
- **business_settings** - Configuraciones del negocio

### Funcionalidades de Seguridad
- **RLS Policies** - Acceso controlado por usuario y rol
- **Audit Triggers** - Registro automático de cambios
- **Data Validation** - Validación a nivel de base de datos

## 🎯 Características de la IA

### Análisis Financiero Inteligente
- **Distribución de Ganancias**: Cálculos automáticos basados en rendimiento
- **Recomendaciones Contextuales**: Específico para el mercado peruano
- **Predicciones de Tendencias**: Análisis de patrones de venta y gasto
- **Optimización de Recursos**: Sugerencias para mejora de eficiencia

### Prompts Especializados
Los prompts de IA están optimizados para:
- Contexto cultural y económico peruano
- Negocios de comida rápida
- Análisis de socios y distribución de ganancias
- Recomendaciones de reinversión

## 🔄 Estado del Proyecto

### ✅ Completado
- [x] Configuración completa de Next.js 15 + TypeScript
- [x] Integración con Supabase y configuración de RLS
- [x] Schema completo de base de datos con datos de ejemplo
- [x] Sistema de autenticación y gestión de usuarios
- [x] Páginas funcionales: Dashboard, Ventas, Gastos, Consejos IA
- [x] Integración completa con Gemini Pro para análisis financiero
- [x] Componentes UI responsivos y accesibles
- [x] Servicios type-safe para todas las operaciones CRUD

### 🚀 Próximas Funcionalidades
- [ ] Módulo de inventario y stock
- [ ] Reportes avanzados y exportación PDF
- [ ] Notificaciones push y recordatorios
- [ ] Integración con métodos de pago
- [ ] Dashboard para múltiples sucursales
- [ ] App móvil con React Native

## 🤝 Estructura del Equipo

El sistema está diseñado para **3 usuarios**:
- **1 Superadmin** - Control total del sistema
- **2 Socios** - Acceso a sus respectivos datos y métricas

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 **Mobile First** - Diseño prioritario para dispositivos móviles
- 💻 **Desktop** - Experiencia completa en escritorio  
- 📊 **Tablet** - Adaptación perfecta para tablets

## 🛡️ Seguridad

- **Row Level Security** implementado en Supabase
- **Validación type-safe** en frontend y backend
- **Auditoría completa** de todas las acciones
- **Autenticación segura** con JWT tokens
- **HTTPS enforced** en producción

## 🚀 Despliegue

### Opción A: Vercel (recomendada)
- Conecta el repositorio y crea un nuevo proyecto.
- En Settings → Environment Variables, agrega:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `GOOGLE_GENKIT_API_KEY` (solo server)
- Vercel ejecuta `npm run build` y sirve con `next start` automáticamente.
- Antes de subir, puedes probar localmente modo producción:

```bash
npm ci
npm run build
npm run start
```

### Opción B: Hostinger (Node.js App)
- Requiere plan con soporte para Node.js (no hosting PHP compartido).
- Sube el código, instala dependencias y construye:

```bash
npm ci
npm run build
```

- Define variables de entorno en el panel:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `GOOGLE_GENKIT_API_KEY`
	- `NODE_ENV=production`

- Inicia la app con `npm run start` (o un `server.js` que haga `next start`).

Sugerencia: también puedes usar la salida `standalone` de Next.js para despliegues más ligeros.


**Desarrollado con ❤️ para emprendedores peruanos en el sector de comida rápida**

*¿Tienes preguntas o sugerencias? ¡Contáctanos!* 🚀
