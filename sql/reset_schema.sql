-- Script SQL para LIMPIAR y RECREAR el esquema de FFFinazas (public)
-- Fecha: 2025-09-23
-- Ejecutar en Supabase (schema: public)
-- ADVERTENCIA: Esto elimina datos existentes.

-- ============================================
-- PASO 0: DESHABILITAR RLS Y ELIMINAR TABLAS
-- ============================================
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename IN (
        'audit_logs','business_settings','expenses','sales','distribution_types','expense_categories','products','users'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.distribution_types CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- PASO 1: CREAR TABLAS
-- ============================================

-- 1) Usuarios (autenticación simplificada para demo)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- opcional en demo
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2) Productos
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3) Categorías de gastos
CREATE TABLE public.expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4) Tipos de distribución (rubros de la calculadora)
CREATE TABLE public.distribution_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 5) Ventas
CREATE TABLE public.sales (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  recorded_by TEXT REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 6) Gastos
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  category_id TEXT REFERENCES public.expense_categories(id),
  category_name TEXT,
  date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  recorded_by TEXT REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 7) Auditoría
CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT REFERENCES public.users(id),
  details TEXT,
  date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 8) Configuración del negocio
CREATE TABLE public.business_settings (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'FFFinanzas',
  updated_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 2: HABILITAR RLS
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 3: POLÍTICAS PERMISIVAS (DESARROLLO)
-- Nota: En producción debes restringir con auth.uid() etc.
-- ============================================

-- Usuarios
CREATE POLICY users_select ON public.users FOR SELECT USING (true);
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY users_update ON public.users FOR UPDATE USING (true);
CREATE POLICY users_delete ON public.users FOR DELETE USING (true);

-- Productos
CREATE POLICY products_select ON public.products FOR SELECT USING (true);
CREATE POLICY products_insert ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY products_update ON public.products FOR UPDATE USING (true);
CREATE POLICY products_delete ON public.products FOR DELETE USING (true);

-- Categorías
CREATE POLICY expcat_select ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY expcat_insert ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY expcat_update ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY expcat_delete ON public.expense_categories FOR DELETE USING (true);

-- Tipos de distribución
CREATE POLICY disttypes_select ON public.distribution_types FOR SELECT USING (true);
CREATE POLICY disttypes_insert ON public.distribution_types FOR INSERT WITH CHECK (true);
CREATE POLICY disttypes_update ON public.distribution_types FOR UPDATE USING (true);
CREATE POLICY disttypes_delete ON public.distribution_types FOR DELETE USING (true);

-- Ventas
CREATE POLICY sales_select ON public.sales FOR SELECT USING (true);
CREATE POLICY sales_insert ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY sales_update ON public.sales FOR UPDATE USING (true);
CREATE POLICY sales_delete ON public.sales FOR DELETE USING (true);

-- Gastos
CREATE POLICY expenses_select ON public.expenses FOR SELECT USING (true);
CREATE POLICY expenses_insert ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY expenses_update ON public.expenses FOR UPDATE USING (true);
CREATE POLICY expenses_delete ON public.expenses FOR DELETE USING (true);

-- Auditoría
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY audit_insert ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Configuración
CREATE POLICY bs_select ON public.business_settings FOR SELECT USING (true);
CREATE POLICY bs_insert ON public.business_settings FOR INSERT WITH CHECK (true);
CREATE POLICY bs_update ON public.business_settings FOR UPDATE USING (true);
CREATE POLICY bs_delete ON public.business_settings FOR DELETE USING (true);

-- ============================================
-- PASO 4: ÍNDICES
-- ============================================
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- ============================================
-- PASO 5: SEEDS MÍNIMOS
-- ============================================
INSERT INTO public.users (id, name, email, password, role, avatar_url) VALUES
('user_admin_001', 'Administrador', 'admin@admin.com', 'Admin123!', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin');

INSERT INTO public.business_settings (id, business_name, updated_by)
VALUES ('settings_001', 'FFFinanzas', 'user_admin_001');

-- Tipos de distribución base (visibles/ajustables en la app)
INSERT INTO public.distribution_types (id, name, percentage) VALUES
('dist_socio1', 'Socio 1', 0),
('dist_socio2', 'Socio 2', 0),
('dist_reinv', 'Reinversión', 0),
('dist_fondo', 'Fondo de Emergencia', 0);

-- ============================================
-- PASO 6 (OPCIONAL): NOTAS PARA STORAGE DE AVATARES
-- ============================================
-- 1) Crea el bucket público 'avatars' desde la UI de Supabase (Storage > New bucket > Public).
-- 2) Políticas públicas de lectura (si el bucket no es público):
--    En SQL Editor, puedes usar:
--    -- Habilitar lectura pública desde Storage (si no marcaste como Public)
--    -- Nota: en Supabase, marcar el bucket como Public es suficiente para URLs públicas.
-- 3) La app sube a rutas tipo 'users/{userId}/avatar_TIMESTAMP.ext' y usa getPublicUrl.

-- ============================================
-- FIN DEL SCRIPT ✅
