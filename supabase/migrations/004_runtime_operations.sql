-- Runtime operations data managed from admin dashboard (no mock memory state)

create extension if not exists "pgcrypto";

alter table if exists app_customers
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists preferences text[] not null default '{}',
  add column if not exists notes text[] not null default '{}',
  add column if not exists pipeline_stage text not null default 'lead'
    check (pipeline_stage in (
      'lead',
      'contactado',
      'reservado',
      'deposito_pagado',
      'pagado_parcial',
      'pagado_total',
      'completado',
      'cancelado'
    )),
  add column if not exists tags text[] not null default '{}';

create table if not exists app_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references app_customers(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  trip_slug text not null references app_trips(slug) on update cascade,
  room_type text not null check (room_type in ('single', 'doble', 'triple')),
  travelers int not null check (travelers > 0),
  amount numeric(12,2) not null check (amount > 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  balance_amount numeric(12,2) not null check (balance_amount >= 0),
  status text not null default 'reservado'
    check (status in (
      'lead',
      'contactado',
      'reservado',
      'deposito_pagado',
      'pagado_parcial',
      'pagado_total',
      'completado',
      'cancelado'
    )),
  paypal_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references app_bookings(id) on delete cascade,
  customer_email text not null,
  trip_slug text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  payment_type text not null check (payment_type in ('deposit', 'installment', 'balance', 'addon')),
  due_date date,
  paid_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'overdue')),
  paypal_order_id text,
  created_at timestamptz not null default now()
);

create table if not exists app_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('trip', 'booking', 'customer', 'proposal')),
  entity_id text not null,
  title text not null,
  language text not null check (language in ('es', 'en')),
  audience text not null check (audience in ('client', 'internal')),
  include_prices boolean not null default true,
  download_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references app_automation_rules(id) on delete set null,
  rule_name text not null,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  entity_type text not null check (entity_type in ('booking', 'payment', 'trip', 'proposal')),
  entity_id text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists app_custom_trip_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  travelers int not null check (travelers > 0),
  budget numeric(12,2) not null check (budget > 0),
  motive text not null,
  expectations text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewing', 'package_ready', 'accepted', 'changes_requested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_custom_package_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references app_custom_trip_requests(id) on delete cascade,
  title text not null,
  summary text not null,
  itinerary text[] not null default '{}',
  includes text[] not null default '{}',
  excludes text[] not null default '{}',
  price_per_person numeric(12,2) not null check (price_per_person > 0),
  deposit numeric(12,2) not null check (deposit > 0),
  payment_plan text not null,
  notes text not null,
  pdf_url text not null,
  page_url text not null,
  revision int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_client_proposal_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references app_custom_trip_requests(id) on delete cascade,
  action text not null check (action in ('accept', 'changes')),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body_preview text not null,
  provider text not null check (provider in ('resend', 'simulated')),
  sent_at timestamptz not null default now()
);

create index if not exists idx_app_bookings_customer_created
  on app_bookings(customer_id, created_at desc);

create index if not exists idx_app_bookings_status
  on app_bookings(status, created_at desc);

create index if not exists idx_app_payments_booking_status_due
  on app_payments(booking_id, status, due_date);

create index if not exists idx_app_documents_entity
  on app_documents(entity_type, entity_id, created_at desc);

create index if not exists idx_app_custom_requests_status
  on app_custom_trip_requests(status, created_at desc);

create index if not exists idx_app_custom_responses_request
  on app_client_proposal_responses(request_id, created_at desc);

create index if not exists idx_app_automation_runs_scheduled
  on app_automation_runs(scheduled_at desc);

create index if not exists idx_app_email_logs_recipient
  on app_email_logs(recipient, sent_at desc);

alter table app_bookings enable row level security;
alter table app_payments enable row level security;
alter table app_documents enable row level security;
alter table app_automation_runs enable row level security;
alter table app_custom_trip_requests enable row level security;
alter table app_custom_package_proposals enable row level security;
alter table app_client_proposal_responses enable row level security;
alter table app_email_logs enable row level security;
