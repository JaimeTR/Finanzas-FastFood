-- Crear tabla distribution_types (si no existe)
create table if not exists public.distribution_types (
  id varchar(50) primary key,
  name varchar(100) not null,
  percentage numeric(5,2) not null default 0,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_distribution_types_updated
before update on public.distribution_types
for each row execute function public.set_updated_at();

-- RLS (demo permisivo)
alter table public.distribution_types enable row level security;
create policy if not exists "Allow all distribution_types" on public.distribution_types using (true) with check (true);

-- Semillas opcionales
insert into public.distribution_types (id, name, percentage)
values
  ('dist_socios', 'Socios', 50),
  ('dist_compras', 'Compras Futuras', 30),
  ('dist_fondo', 'Fondo de Emergencia', 20)
on conflict (id) do nothing;
