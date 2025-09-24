# 🚀 Guía de Configuración de Supabase para FFFinazas

## 📋 Pasos para configurar tu proyecto

### 1. **Crear tu proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa los datos:
   - **Name**: FFFinazas
   - **Organization**: Tu organización
   - **Password**: Una contraseña segura para tu base de datos
   - **Region**: Elige la región más cercana

### 2. **Obtener las credenciales**
Una vez creado el proyecto:
1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (algo como: `https://abcdefg.supabase.co`)
   - **Anon Key** (clave pública)
   - **Service Role Key** (clave privada - mantenerla secreta)

### 3. **Configurar variables de entorno**
1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Reemplaza las variables con tus valores reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Ejecutar el script SQL**
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega todo el contenido del archivo `supabase-schema.sql`
4. Haz clic en **Run** para ejecutar el script

### 5. **Verificar la instalación**
1. Ve a **Table Editor** en Supabase
2. Deberías ver estas tablas creadas:
   - `users`
   - `products`
   - `expense_categories`
   - `sales`
   - `expenses`
   - `audit_logs`
   - `business_settings`

### 6. **Probar la aplicación**
1. Ejecuta tu aplicación: `npm run dev`
2. Ve a `http://localhost:9002`
3. Inicia sesión con:
   - **Email**: `superadmin@example.com` o `socio@example.com`
   - **Password**: `password`

## 🔧 **Archivos modificados**

### ✅ **Nuevos archivos creados:**
- `src/lib/supabase.ts` - Cliente de Supabase
- `src/lib/database.types.ts` - Tipos de TypeScript para la BD
- `src/lib/supabase-services.ts` - Servicios para operaciones de BD
- `supabase-schema.sql` - Script de base de datos
- `.env.local` - Variables de entorno

### ✅ **Archivos actualizados:**
- `src/contexts/auth-context.tsx` - Integración con Supabase
- `src/app/sales/page.tsx` - Usando servicios de Supabase
- `package.json` - Dependencia @supabase/supabase-js añadida

## 🎯 **Funcionalidades implementadas:**

### **Autenticación**
- Login con usuarios de la base de datos
- Gestión de sesiones
- Roles de usuario (socio/superadmin)

### **Gestión de Datos**
- **Productos**: CRUD completo
- **Ventas**: Crear y listar ventas
- **Gastos**: Crear y listar gastos
- **Categorías**: Gestión de categorías de gastos
- **Auditoría**: Registro automático de acciones

### **Seguridad**
- Row Level Security (RLS) habilitado
- Políticas de acceso por roles
- Validación de datos en frontend y backend

## 🚨 **Próximos pasos sugeridos:**

1. **Actualizar páginas restantes:**
   - Dashboard (cargar datos reales)
   - Expenses (similar a Sales)
   - Settings (configuración del negocio)

2. **Mejorar autenticación:**
   - Implementar Supabase Auth
   - Recuperación de contraseñas
   - Registro de nuevos usuarios

3. **Optimizaciones:**
   - Paginación en las listas
   - Filtros y búsqueda
   - Caché local para mejor UX

4. **Reportes avanzados:**
   - Gráficos con datos reales
   - Exportación a PDF/Excel
   - Análisis de tendencias

## 🆘 **Solución de problemas:**

### Error de conexión:
- Verifica que las URLs y claves estén correctas
- Asegúrate de que no hay espacios extra en las variables de entorno

### Error de permisos:
- Verifica que RLS esté configurado correctamente
- Comprueba que los usuarios existan en la tabla `users`

### Error en tipos TypeScript:
- Ejecuta `npm run typecheck` para verificar errores
- Regenera los tipos si es necesario

¡Tu aplicación FFFinazas ahora está conectada a Supabase! 🎉