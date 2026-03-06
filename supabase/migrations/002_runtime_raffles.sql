-- Runtime tables for registration + raffles module

create extension if not exists "pgcrypto";

create table if not exists app_customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  is_registered boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_raffles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  is_free boolean not null default true,
  entry_fee numeric(12,2) not null default 0,
  payment_instructions text not null default 'No requiere pago.',
  requirements text not null default 'Usuario registrado.',
  prize text not null,
  start_date date not null,
  end_date date not null,
  draw_at timestamptz not null,
  number_pool_size int not null check (number_pool_size > 0),
  winner_entry_id uuid,
  winner_number int,
  winner_customer_email text,
  drawn_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists app_raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references app_raffles(id) on delete cascade,
  customer_id uuid not null references app_customers(id) on delete cascade,
  customer_email text not null,
  chosen_number int not null check (chosen_number > 0),
  payment_reference text,
  note text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_review', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (raffle_id, customer_id)
);

create unique index if not exists idx_app_raffle_entries_number_active
  on app_raffle_entries (raffle_id, chosen_number)
  where status <> 'rejected';

create index if not exists idx_app_raffles_status_draw_at
  on app_raffles (status, draw_at);

create index if not exists idx_app_raffle_entries_raffle_status
  on app_raffle_entries (raffle_id, status);

alter table app_customers enable row level security;
alter table app_raffles enable row level security;
alter table app_raffle_entries enable row level security;
