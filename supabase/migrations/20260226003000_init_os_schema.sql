create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid not null,
  employee_id text unique,
  full_name text,
  role text not null default 'staff'::text,
  property_id text not null default 'main'::text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_pkey primary key (user_id),
  constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id),
  constraint profiles_role_check check (role = any (array['admin'::text, 'manager'::text, 'staff'::text]))
);
alter table public.profiles enable row level security;

create table if not exists public.master_list (
  id uuid not null default gen_random_uuid(),
  property_id text not null default 'main'::text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_list_pkey primary key (id)
);
alter table public.master_list enable row level security;

create table if not exists public.reservations (
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint reservations_pkey primary key (id)
);
alter table public.reservations enable row level security;

create table if not exists public.app_users (
  id uuid not null,
  email text,
  full_name text,
  role text not null default 'viewer'::text,
  allowed_pages jsonb not null default '["dashboard"]'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_users_pkey primary key (id),
  constraint app_users_id_fkey foreign key (id) references auth.users(id)
);
alter table public.app_users enable row level security;

create table if not exists public.ocean_extra_revenues (
  id text not null,
  revenue_date date not null,
  type text not null,
  description text not null default ''::text,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ocean_extra_revenues_pkey primary key (id)
);
alter table public.ocean_extra_revenues enable row level security;

create table if not exists public.ocean_store_items (
  id text not null,
  data jsonb,
  updated_at timestamptz default now(),
  constraint ocean_store_items_pkey primary key (id)
);
alter table public.ocean_store_items enable row level security;

create table if not exists public.ocean_store_moves (
  id text not null,
  data jsonb,
  updated_at timestamptz default now(),
  constraint ocean_store_moves_pkey primary key (id)
);
alter table public.ocean_store_moves enable row level security;

create table if not exists public.ocean_store_suppliers (
  id text not null,
  data jsonb,
  updated_at timestamptz default now(),
  constraint ocean_store_suppliers_pkey primary key (id)
);
alter table public.ocean_store_suppliers enable row level security;

create table if not exists public.ocean_expenses (
  id text not null,
  expense_date date,
  category text,
  vendor text,
  description text,
  amount numeric,
  method text,
  ref text,
  updated_at timestamptz default now(),
  constraint ocean_expenses_pkey primary key (id)
);
alter table public.ocean_expenses enable row level security;

create table if not exists public.ocean_oos_periods (
  id text not null,
  room_number text not null,
  start_date date not null,
  end_date date not null,
  reason text default ''::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint ocean_oos_periods_pkey primary key (id)
);
comment on table public.ocean_oos_periods is 'Stores Out of Service room periods with date ranges';
alter table public.ocean_oos_periods enable row level security;
