-- Inicialización completa del esquema para FFFinazas
-- Ejecutar en Supabase (SQL Editor) antes de iniciar la app

-- Nota: Este script usa RLS permisivo para facilitar desarrollo.
-- Ajusta las políticas para producción.

-- =============================
-- Tabla: users
-- =============================
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text unique not null,
  password text,
  role text not null default 'user',
  avatar_url text,
  created_at timestamp without time zone default now()
);

alter table public.users enable row level security;
create policy if not exists users_select on public.users for select using (true);
create policy if not exists users_insert on public.users for insert with check (true);
create policy if not exists users_update on public.users for update using (true);
create policy if not exists users_delete on public.users for delete using (true);

-- =============================
-- Tabla: products
-- =============================
create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric(12,2) not null default 0,
  created_at timestamp without time zone default now()
);

alter table public.products enable row level security;
create policy if not exists products_select on public.products for select using (true);
create policy if not exists products_insert on public.products for insert with check (true);
create policy if not exists products_update on public.products for update using (true);
create policy if not exists products_delete on public.products for delete using (true);

-- =============================
-- Tabla: expense_categories
-- =============================
create table if not exists public.expense_categories (
  id text primary key,
  name text not null,
  created_at timestamp without time zone default now()
);

alter table public.expense_categories enable row level security;
create policy if not exists expcat_select on public.expense_categories for select using (true);
create policy if not exists expcat_insert on public.expense_categories for insert with check (true);
create policy if not exists expcat_update on public.expense_categories for update using (true);
create policy if not exists expcat_delete on public.expense_categories for delete using (true);

-- =============================
-- Tabla: distribution_types
-- =============================
create table if not exists public.distribution_types (
  id text primary key,
  name text not null,
  percentage numeric(5,2) not null default 0,
  created_at timestamp without time zone default now()
);

alter table public.distribution_types enable row level security;
create policy if not exists disttypes_select on public.distribution_types for select using (true);
create policy if not exists disttypes_insert on public.distribution_types for insert with check (true);
create policy if not exists disttypes_update on public.distribution_types for update using (true);
create policy if not exists disttypes_delete on public.distribution_types for delete using (true);

-- Seed inicial (opcional; ignora errores si ya existen)
insert into public.distribution_types (id, name, percentage)
values
  ('dist_socios', 'Socios', 0),
  ('dist_reinv', 'Reinversión', 0),
  ('dist_fondo', 'Fondo de Emergencia', 0)
 on conflict (id) do nothing;

-- =============================
-- Tabla: sales
-- =============================
create table if not exists public.sales (
  id text primary key,
  product_id text,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(14,2) not null default 0,
  date timestamp without time zone not null default now(),
  recorded_by text,
  notes text
);

alter table public.sales enable row level security;
create policy if not exists sales_select on public.sales for select using (true);
create policy if not exists sales_insert on public.sales for insert with check (true);
create policy if not exists sales_update on public.sales for update using (true);
create policy if not exists sales_delete on public.sales for delete using (true);

-- =============================
-- Tabla: expenses
-- =============================
create table if not exists public.expenses (
  id text primary key,
  description text not null,
  amount numeric(14,2) not null,
  category_id text,
  category_name text,
  date timestamp without time zone not null default now(),
  recorded_by text,
  notes text
);

alter table public.expenses enable row level security;
create policy if not exists expenses_select on public.expenses for select using (true);
create policy if not exists expenses_insert on public.expenses for insert with check (true);
create policy if not exists expenses_update on public.expenses for update using (true);
create policy if not exists expenses_delete on public.expenses for delete using (true);

-- =============================
-- Tabla: audit_logs
-- =============================
create table if not exists public.audit_logs (
  id text primary key,
  action text not null,
  user_id text,
  details text,
  date timestamp without time zone not null default now()
);

alter table public.audit_logs enable row level security;
create policy if not exists audit_select on public.audit_logs for select using (true);
create policy if not exists audit_insert on public.audit_logs for insert with check (true);

-- =============================
-- Tabla: business_settings
-- =============================
create table if not exists public.business_settings (
  id text primary key default 'settings_001',
  business_name text not null default 'Mi Negocio',
  updated_by text,
  updated_at timestamp without time zone not null default now()
);

alter table public.business_settings enable row level security;
create policy if not exists bs_select on public.business_settings for select using (true);
create policy if not exists bs_upsert on public.business_settings for insert with check (true);
create policy if not exists bs_update on public.business_settings for update using (true);

-- Seed de business_settings
insert into public.business_settings (id, business_name)
values ('settings_001', 'Mi Negocio')
  on conflict (id) do nothing;

-- Seed de usuario admin (opcional)
insert into public.users (id, name, email, password, role)
values ('user_admin', 'Admin', 'admin@example.com', 'admin', 'admin')
  on conflict (id) do nothing;
