# 🔄 Migración a Nueva Base de Datos Supabase - FFFinanzas

## ✅ Credenciales Actualizadas

### 🆕 **Nueva Configuración de Supabase**
```env
URL: https://qoggngzbinhkbphlowdj.supabase.co
API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ2duZ3piaW5oa2JwaGxvd2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzgwMzAsImV4cCI6MjA3NDAxNDAzMH0.I1xL5vSs740RTMeIcD6ZX2VlwKUqy4CJLEgg684AqmA
```

## 📋 Pasos para Completar la Migración

### 1. **Ejecutar Schema Principal**
Ve a tu proyecto Supabase (https://qoggngzbinhkbphlowdj.supabase.co) y ejecuta el archivo `supabase-schema.sql` completo:

1. **Accede al SQL Editor** en tu dashboard de Supabase
2. **Copia todo el contenido** del archivo `supabase-schema.sql` 
3. **Pégalo y ejecuta** el script completo
4. **Verifica** que todas las tablas se crearon correctamente

### 2. **Configurar Usuarios de Acceso**
Después del schema principal, ejecuta el script `update-emails.sql`:

```sql
-- Crear/Actualizar usuarios
INSERT INTO users (id, name, email, role, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Jaime Tarazona', 'admin@fffinanzas.com', 'superadmin', '/avatars/admin.png')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO users (id, name, email, role, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Carlos Mendoza', 'carlos@fffinanzas.com', 'socio', '/avatars/socio1.png')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO users (id, name, email, role, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440003', 'María García', 'maria@fffinanzas.com', 'socio', '/avatars/socio2.png')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;
```

### 3. **Verificar la Conexión**
Después de ejecutar los scripts, verifica que la aplicación se conecte:

1. **Servidor en ejecución**: http://localhost:9002
2. **Probar login**: Usa las credenciales configuradas
3. **Verificar datos**: Las tablas deben tener datos de ejemplo

## 🔑 Credenciales de Acceso

### 🔱 **SUPERADMIN**
```
Email: admin@fffinanzas.com
Contraseña: Admin123!
Rol: Control total del sistema
```

### 👤 **SOCIO 1**
```
Email: carlos@fffinanzas.com
Contraseña: Carlos123!
Rol: Acceso de socio
```

### 👤 **SOCIO 2**
```
Email: maria@fffinanzas.com
Contraseña: Maria123!
Rol: Acceso de socio
```

## 📊 Estructura de Base de Datos Incluida

### **Tablas Principales:**
- ✅ `users` - Sistema de usuarios con roles
- ✅ `products` - Catálogo de productos
- ✅ `sales` - Registro de ventas
- ✅ `expenses` - Control de gastos
- ✅ `expense_categories` - Categorías de gastos
- ✅ `audit_logs` - Auditoría del sistema
- ✅ `business_settings` - Configuración del negocio

### **Datos de Ejemplo Incluidos:**
- ✅ 3 usuarios (1 admin + 2 socios)
- ✅ 6 productos de fast food
- ✅ 6 categorías de gastos
- ✅ Ventas de ejemplo de los últimos días
- ✅ Gastos de ejemplo
- ✅ Configuración inicial del negocio

### **Seguridad Configurada:**
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acceso por roles
- ✅ Auditoría automática de cambios
- ✅ Índices optimizados para rendimiento

## 🚀 Probar la Aplicación

### **1. Acceder al Login**
```
URL: http://localhost:9002/login
```

### **2. Probar Funcionalidades**
- ✅ **Dashboard**: Métricas en tiempo real
- ✅ **Ventas**: Registrar nuevas ventas
- ✅ **Gastos**: Controlar gastos operacionales
- ✅ **Consejos IA**: Análisis financiero con Gemini Pro

### **3. Verificar Datos**
- Las ventas y gastos deben mostrar datos reales
- Los gráficos deben tener información
- La IA debe funcionar con los datos de la semana

## 🔧 Troubleshooting

### **Si hay errores de conexión:**
1. Verifica que las credenciales en `.env.local` sean correctas
2. Asegúrate de que el schema se ejecutó completamente
3. Revisa que los usuarios estén creados en la tabla `users`

### **Si el login no funciona:**
1. Verifica que los emails estén correctamente configurados
2. Asegúrate de usar las contraseñas exactas: `Admin123!`, `Carlos123!`, `Maria123!`
3. Revisa que la función `authenticateUser` esté funcionando

### **Si no hay datos:**
1. Ejecuta nuevamente las secciones de datos iniciales del schema
2. Verifica que las tablas tengan los datos de ejemplo
3. Comprueba que las políticas RLS permitan acceso a los datos

## 📝 Siguientes Pasos

### **Desarrollo:**
1. ✅ La aplicación está lista para usar
2. ✅ Puedes agregar nuevos productos, ventas y gastos
3. ✅ La IA funcionará con datos reales
4. ✅ Los reportes mostrarán métricas actualizadas

### **Personalización:**
1. **Agregar productos reales** de tu negocio
2. **Configurar categorías** específicas de gastos
3. **Registrar ventas y gastos reales**
4. **Customizar el nombre del negocio** en configuración

---

## ⚠️ Importante

**Estado actual:**
- ✅ Credenciales actualizadas
- ✅ Servidor reiniciado
- ⏳ **PENDIENTE**: Ejecutar scripts SQL en la nueva base de datos

**Próximo paso:** Ejecuta el `supabase-schema.sql` en tu nueva base de datos de Supabase.

---

¡Tu aplicación FFFinanzas está lista para funcionar con la nueva base de datos! 🎉