-- Móntate en mi viaje - initial schema (PayPal version)

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid,
  role text not null check (role in ('admin', 'manager', 'support', 'editor')),
  permissions_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text,
  preferences jsonb not null default '{}'::jsonb,
  pipeline_stage text not null default 'lead',
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  destination text not null,
  category text not null check (category in ('Luxury', 'Adventure', 'Family', 'Romantic', 'Budget')),
  start_date date not null,
  end_date date not null,
  capacity int not null check (capacity > 0),
  seats_available int not null check (seats_available >= 0),
  base_price numeric(12,2) not null,
  deposit_amount numeric(12,2) not null,
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published', 'unpublished', 'archived')),
  summary text,
  hero_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null check (day_number > 0),
  title text not null,
  description text not null,
  activities jsonb not null default '[]'::jsonb,
  hotel_name text,
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table if not exists trip_packages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  room_type text not null check (room_type in ('single', 'doble', 'triple')),
  price_per_person numeric(12,2) not null,
  deposit numeric(12,2) not null,
  payment_plan text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trip_id, room_type)
);

create table if not exists trip_addons (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null,
  capacity int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  value numeric(12,2) not null,
  max_uses int,
  used_count int not null default 0,
  valid_from timestamptz,
  valid_to timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  booking_number text not null,
  trip_id uuid not null references trips(id),
  customer_id uuid not null references customers(id),
  package_id uuid references trip_packages(id),
  room_type text not null check (room_type in ('single', 'doble', 'triple')),
  travelers_count int not null default 1,
  subtotal numeric(12,2) not null,
  discount_total numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  deposit_amount numeric(12,2) not null,
  balance_amount numeric(12,2) not null,
  status text not null default 'lead' check (status in ('lead', 'contactado', 'reservado', 'deposito_pagado', 'pagado_parcial', 'pagado_total', 'completado', 'cancelado')),
  referral_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, booking_number)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  paypal_order_id text,
  paypal_capture_id text,
  paypal_payer_email text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payment_type text not null check (payment_type in ('deposit', 'installment', 'balance', 'addon')),
  due_date date,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'overdue')),
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  customer_id uuid references customers(id),
  rating int not null check (rating between 1 and 5),
  content text not null,
  media_url text,
  verified boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  title text not null,
  cover_media_id uuid,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists gallery_media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references gallery_albums(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null,
  thumbnail_path text,
  caption text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  doc_type text not null,
  language text not null default 'es',
  version int not null default 1,
  storage_path text not null,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'internal')),
  created_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_event text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'push', 'in_app')),
  template_key text not null,
  delay_minutes int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  priority int not null default 100,
  status text not null default 'active' check (status in ('active', 'offered', 'converted', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_trips_destination_date on trips(destination, start_date, publish_status);
create index if not exists idx_bookings_customer_status on bookings(customer_id, status, created_at);
create index if not exists idx_payments_booking_status_due on payments(booking_id, status, due_date);
create index if not exists idx_testimonials_trip_approved on testimonials(trip_id, approved, verified);

-- RLS (enable now; policies can be expanded in next migration)
alter table organizations enable row level security;
alter table team_members enable row level security;
alter table customers enable row level security;
alter table trips enable row level security;
alter table trip_days enable row level security;
alter table trip_packages enable row level security;
alter table trip_addons enable row level security;
alter table discount_codes enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table testimonials enable row level security;
alter table gallery_albums enable row level security;
alter table gallery_media enable row level security;
alter table documents enable row level security;
alter table automations enable row level security;
alter table automation_runs enable row level security;
alter table waitlist_entries enable row level security;
alter table audit_logs enable row level security;
