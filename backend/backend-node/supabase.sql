-- ================================
-- HOMI Supabase Schema
-- ================================

-- Orgs table (multi-tenant)
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Units table
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  address text not null,
  monthly_rent numeric not null,
  notes text,
  cover_image_uri text,
  created_by text,
  created_at timestamptz default now()
);

-- Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  lease_start date,
  lease_end date,
  unit_id uuid references public.units(id) on delete set null,
  created_at timestamptz default now()
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  due_date date not null,
  amount numeric not null,
  status text check (status in ('due','paid')) default 'due',
  paid_at timestamptz,
  method text check (method in ('cash','transfer','other')) default 'other',
  note text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_units_org_id on public.units(org_id);
create index if not exists idx_tenants_org_id on public.tenants(org_id);
create index if not exists idx_payments_org_id on public.payments(org_id);
create index if not exists idx_tenants_unit_id on public.tenants(unit_id);
create index if not exists idx_payments_tenant_id on public.payments(tenant_id);

-- ================================
-- Storage buckets
-- ================================
insert into storage.buckets (id, name, public)
values ('unit-media', 'unit-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('tenant-media', 'tenant-media', true)
on conflict (id) do nothing;

-- ================================
-- Optional: Row Level Security (RLS)
-- ================================
-- Keep disabled for MVP and enforce org_id in backend.
-- Uncomment and adjust if you want DB to enforce tenant isolation.

-- alter table public.units enable row level security;
-- create policy "org can read own units"
-- on public.units for select
-- using (org_id = current_setting('app.org_id', true)::uuid);

-- create policy "org can write own units"
-- on public.units for all
-- using (org_id = current_setting('app.org_id', true)::uuid)
-- with check (org_id = current_setting('app.org_id', true)::uuid);

-- Repeat similar RLS for tenants and payments if desired.
