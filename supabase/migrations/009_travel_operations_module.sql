-- Travel Desk internal module (admin/moderation operations)

create extension if not exists "pgcrypto";

-- -----------------------------
-- Profiles role expansion
-- -----------------------------

update public.profiles
set role = 'user'
where role is null
   or role not in ('super_admin', 'admin', 'manager', 'moderator', 'travel_agent', 'user');

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'manager', 'moderator', 'travel_agent', 'user'));

drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all"
on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
);

drop policy if exists "profiles_admin_manage_all" on public.profiles;
create policy "profiles_admin_manage_all"
on public.profiles
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
);

create or replace function public.is_travel_ops_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'admin', 'manager', 'moderator', 'travel_agent')
  );
$$;

-- -----------------------------
-- Travel search sessions
-- -----------------------------

create table if not exists app_travel_search_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  search_type text not null check (search_type in ('flights', 'hotels')),
  origin text,
  destination text,
  check_in date,
  check_out date,
  departure_date date,
  return_date date,
  passengers_json jsonb not null default '{}'::jsonb,
  filters_json jsonb not null default '{}'::jsonb,
  provider_sources_json jsonb not null default '[]'::jsonb,
  raw_request_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '[]'::jsonb,
  result_count int not null default 0,
  search_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_travel_search_type_created
  on app_travel_search_sessions(search_type, created_at desc);

create index if not exists idx_app_travel_search_hash_recent
  on app_travel_search_sessions(search_hash, search_type, created_at desc);

-- -----------------------------
-- Travel quotes
-- -----------------------------

create table if not exists app_travel_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  client_id uuid references app_customers(id) on delete set null,
  client_name text,
  client_email text,
  destination text not null default '',
  departure_date date,
  return_date date,
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'expired', 'cancelled')),
  subtotal numeric(12,2) not null default 0,
  taxes_total numeric(12,2) not null default 0,
  markup_total numeric(12,2) not null default 0,
  fees_total numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  notes_internal text,
  notes_client text,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_travel_quotes_status_created
  on app_travel_quotes(status, created_at desc);

create table if not exists app_travel_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references app_travel_quotes(id) on delete cascade,
  item_type text not null check (item_type in ('flight', 'hotel', 'transfer', 'activity', 'insurance', 'fee', 'manual')),
  provider_name text,
  external_offer_id text,
  title text not null,
  summary_json jsonb not null default '{}'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  base_price numeric(12,2) not null default 0,
  taxes numeric(12,2) not null default 0,
  markup numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_travel_quote_items_quote_sort
  on app_travel_quote_items(quote_id, sort_order, created_at);

-- -----------------------------
-- Travel packages
-- -----------------------------

create table if not exists app_travel_packages (
  id uuid primary key default gen_random_uuid(),
  package_name text not null,
  destination text not null default '',
  status text not null default 'draft' check (status in ('draft', 'internal', 'ready', 'archived')),
  visibility text not null default 'internal' check (visibility in ('internal', 'private')),
  start_date date,
  end_date date,
  base_quote_id uuid references app_travel_quotes(id) on delete set null,
  linked_trip_slug text,
  notes text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_travel_packages_status_created
  on app_travel_packages(status, created_at desc);

create table if not exists app_travel_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references app_travel_packages(id) on delete cascade,
  item_type text not null check (item_type in ('flight', 'hotel', 'transfer', 'activity', 'insurance', 'fee', 'manual')),
  source_quote_item_id uuid references app_travel_quote_items(id) on delete set null,
  title text not null,
  summary_json jsonb not null default '{}'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  base_price numeric(12,2) not null default 0,
  taxes numeric(12,2) not null default 0,
  markup numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_travel_package_items_package_sort
  on app_travel_package_items(package_id, sort_order, created_at);

-- -----------------------------
-- Travel PDF exports + audit
-- -----------------------------

create table if not exists app_travel_pdf_exports (
  id uuid primary key default gen_random_uuid(),
  related_type text not null check (related_type in ('quote', 'package', 'summary')),
  related_id uuid not null,
  file_path text not null,
  file_name text not null,
  status text not null default 'generated' check (status in ('generated', 'failed')),
  error_message text,
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_travel_pdf_exports_related
  on app_travel_pdf_exports(related_type, related_id, created_at desc);

create table if not exists app_travel_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_travel_audit_logs_actor_created
  on app_travel_audit_logs(actor_id, created_at desc);

create index if not exists idx_app_travel_audit_logs_action_created
  on app_travel_audit_logs(action, created_at desc);

-- -----------------------------
-- RLS policies
-- -----------------------------

alter table app_travel_search_sessions enable row level security;
alter table app_travel_quotes enable row level security;
alter table app_travel_quote_items enable row level security;
alter table app_travel_packages enable row level security;
alter table app_travel_package_items enable row level security;
alter table app_travel_pdf_exports enable row level security;
alter table app_travel_audit_logs enable row level security;

drop policy if exists "travel_search_select" on app_travel_search_sessions;
create policy "travel_search_select"
on app_travel_search_sessions for select
using (public.is_travel_ops_role());

drop policy if exists "travel_search_insert" on app_travel_search_sessions;
create policy "travel_search_insert"
on app_travel_search_sessions for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_search_update" on app_travel_search_sessions;
create policy "travel_search_update"
on app_travel_search_sessions for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_quotes_select" on app_travel_quotes;
create policy "travel_quotes_select"
on app_travel_quotes for select
using (public.is_travel_ops_role());

drop policy if exists "travel_quotes_insert" on app_travel_quotes;
create policy "travel_quotes_insert"
on app_travel_quotes for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_quotes_update" on app_travel_quotes;
create policy "travel_quotes_update"
on app_travel_quotes for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_quotes_delete" on app_travel_quotes;
create policy "travel_quotes_delete"
on app_travel_quotes for delete
using (public.is_travel_ops_role());

drop policy if exists "travel_quote_items_select" on app_travel_quote_items;
create policy "travel_quote_items_select"
on app_travel_quote_items for select
using (public.is_travel_ops_role());

drop policy if exists "travel_quote_items_insert" on app_travel_quote_items;
create policy "travel_quote_items_insert"
on app_travel_quote_items for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_quote_items_update" on app_travel_quote_items;
create policy "travel_quote_items_update"
on app_travel_quote_items for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_quote_items_delete" on app_travel_quote_items;
create policy "travel_quote_items_delete"
on app_travel_quote_items for delete
using (public.is_travel_ops_role());

drop policy if exists "travel_packages_select" on app_travel_packages;
create policy "travel_packages_select"
on app_travel_packages for select
using (public.is_travel_ops_role());

drop policy if exists "travel_packages_insert" on app_travel_packages;
create policy "travel_packages_insert"
on app_travel_packages for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_packages_update" on app_travel_packages;
create policy "travel_packages_update"
on app_travel_packages for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_packages_delete" on app_travel_packages;
create policy "travel_packages_delete"
on app_travel_packages for delete
using (public.is_travel_ops_role());

drop policy if exists "travel_package_items_select" on app_travel_package_items;
create policy "travel_package_items_select"
on app_travel_package_items for select
using (public.is_travel_ops_role());

drop policy if exists "travel_package_items_insert" on app_travel_package_items;
create policy "travel_package_items_insert"
on app_travel_package_items for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_package_items_update" on app_travel_package_items;
create policy "travel_package_items_update"
on app_travel_package_items for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_package_items_delete" on app_travel_package_items;
create policy "travel_package_items_delete"
on app_travel_package_items for delete
using (public.is_travel_ops_role());

drop policy if exists "travel_exports_select" on app_travel_pdf_exports;
create policy "travel_exports_select"
on app_travel_pdf_exports for select
using (public.is_travel_ops_role());

drop policy if exists "travel_exports_insert" on app_travel_pdf_exports;
create policy "travel_exports_insert"
on app_travel_pdf_exports for insert
with check (public.is_travel_ops_role());

drop policy if exists "travel_exports_update" on app_travel_pdf_exports;
create policy "travel_exports_update"
on app_travel_pdf_exports for update
using (public.is_travel_ops_role())
with check (public.is_travel_ops_role());

drop policy if exists "travel_audit_select" on app_travel_audit_logs;
create policy "travel_audit_select"
on app_travel_audit_logs for select
using (public.is_travel_ops_role());

drop policy if exists "travel_audit_insert" on app_travel_audit_logs;
create policy "travel_audit_insert"
on app_travel_audit_logs for insert
with check (public.is_travel_ops_role());
