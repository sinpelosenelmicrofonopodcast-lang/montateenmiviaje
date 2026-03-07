-- Advanced raffle operations: incremental, backward-compatible extension

create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- Core raffle table extensions
-- -------------------------------------------------

alter table if exists app_raffles
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists public_participants_enabled boolean not null default false,
  add column if not exists public_participants_mode text not null default 'masked',
  add column if not exists public_numbers_visibility boolean not null default true,
  add column if not exists public_number_grid_mode text not null default 'full',
  add column if not exists public_winner_name boolean not null default false,
  add column if not exists verification_mode text not null default 'commit_reveal',
  add column if not exists public_seed text,
  add column if not exists secret_commit_hash text,
  add column if not exists draw_algorithm text not null default 'sha256-modulo-v1',
  add column if not exists draw_payload_json jsonb not null default '{}'::jsonb,
  add column if not exists referral_enabled boolean not null default true,
  add column if not exists viral_counter_enabled boolean not null default true,
  add column if not exists urgency_message text,
  add column if not exists public_activity_enabled boolean not null default true,
  add column if not exists live_draw_enabled boolean not null default true;

alter table if exists app_raffles
  drop constraint if exists app_raffles_public_participants_mode_check;

alter table if exists app_raffles
  add constraint app_raffles_public_participants_mode_check
  check (public_participants_mode in ('hidden', 'name_only', 'name_number', 'masked'));

alter table if exists app_raffles
  drop constraint if exists app_raffles_public_number_grid_mode_check;

alter table if exists app_raffles
  add constraint app_raffles_public_number_grid_mode_check
  check (public_number_grid_mode in ('full', 'available_only', 'sold_only', 'totals_only'));

alter table if exists app_raffles
  drop constraint if exists app_raffles_verification_mode_check;

alter table if exists app_raffles
  add constraint app_raffles_verification_mode_check
  check (verification_mode in ('none', 'commit_reveal'));

create index if not exists idx_app_raffles_public_modes
  on app_raffles(status, public_numbers_visibility, public_participants_enabled, draw_at);

-- -------------------------------------------------
-- Raffle entries extensions (no destructive changes)
-- -------------------------------------------------

alter table if exists app_raffle_entries
  add column if not exists source text not null default 'online',
  add column if not exists public_display_name text,
  add column if not exists consent_public_listing boolean not null default false,
  add column if not exists payment_method text,
  add column if not exists phone text,
  add column if not exists referral_code text,
  add column if not exists referred_by_code text,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists app_raffle_entries
  drop constraint if exists app_raffle_entries_source_check;

alter table if exists app_raffle_entries
  add constraint app_raffle_entries_source_check
  check (source in ('online', 'offline', 'admin_manual'));

alter table if exists app_raffle_entries
  drop constraint if exists app_raffle_entries_status_check;

alter table if exists app_raffle_entries
  add constraint app_raffle_entries_status_check
  check (status in ('pending_payment', 'pending_review', 'confirmed', 'rejected', 'cancelled'));

create index if not exists idx_app_raffle_entries_source_status
  on app_raffle_entries(raffle_id, source, status, created_at desc);

create index if not exists idx_app_raffle_entries_referral_code
  on app_raffle_entries(raffle_id, referral_code);

-- -------------------------------------------------
-- Number control table (manual blocking/reserve/sales)
-- -------------------------------------------------

create table if not exists app_raffle_numbers (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references app_raffles(id) on delete cascade,
  number_value int not null check (number_value > 0),
  status text not null default 'available'
    check (status in ('available', 'blocked', 'reserved', 'pending_manual_review', 'sold', 'cancelled', 'winner')),
  entry_id uuid references app_raffle_entries(id) on delete set null,
  customer_id uuid references app_customers(id) on delete set null,
  customer_email text,
  source text not null default 'online' check (source in ('online', 'offline', 'admin_manual')),
  assigned_offline boolean not null default false,
  payment_method text,
  admin_note text,
  blocked_reason text,
  blocked_by uuid references public.profiles(id) on delete set null,
  blocked_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (raffle_id, number_value)
);

create index if not exists idx_app_raffle_numbers_raffle_status
  on app_raffle_numbers(raffle_id, status, number_value);

create index if not exists idx_app_raffle_numbers_raffle_entry
  on app_raffle_numbers(raffle_id, entry_id);

create index if not exists idx_app_raffle_numbers_customer
  on app_raffle_numbers(raffle_id, customer_email);

-- -------------------------------------------------
-- Payments + referrals + audit
-- -------------------------------------------------

create table if not exists app_raffle_payments (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references app_raffles(id) on delete cascade,
  entry_id uuid references app_raffle_entries(id) on delete set null,
  customer_id uuid references app_customers(id) on delete set null,
  customer_email text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  payment_method text not null default 'other'
    check (payment_method in ('paypal', 'zelle', 'cashapp', 'ath_movil', 'cash', 'venmo', 'other')),
  payment_reference text,
  screenshot_url text,
  is_manual boolean not null default false,
  manually_verified boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_raffle_payments_raffle_status
  on app_raffle_payments(raffle_id, status, created_at desc);

create table if not exists app_raffle_referral_events (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references app_raffles(id) on delete cascade,
  referral_code text not null,
  event_type text not null check (event_type in ('click', 'conversion')),
  referred_entry_id uuid references app_raffle_entries(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_raffle_referral_events_code
  on app_raffle_referral_events(raffle_id, referral_code, event_type, created_at desc);

create table if not exists app_raffle_admin_logs (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references app_raffles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_raffle_admin_logs_raffle
  on app_raffle_admin_logs(raffle_id, created_at desc);

-- -------------------------------------------------
-- Helper functions
-- -------------------------------------------------

create or replace function public.is_raffle_admin_role()
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
      and p.role in ('super_admin', 'admin', 'manager', 'moderator')
  );
$$;

create or replace function public.mask_public_name(value text)
returns text
language plpgsql
immutable
as $$
declare
  first_part text;
  second_part text;
begin
  if value is null or length(trim(value)) = 0 then
    return 'Participante';
  end if;

  first_part := split_part(trim(value), ' ', 1);
  second_part := split_part(trim(value), ' ', 2);

  if second_part = '' then
    return left(first_part, 1) || repeat('*', greatest(length(first_part) - 1, 1));
  end if;

  return left(first_part, 3) || repeat('*', greatest(length(first_part) - 3, 1))
    || ' '
    || left(second_part, 3) || repeat('*', greatest(length(second_part) - 3, 1));
end;
$$;

-- -------------------------------------------------
-- Backfill numbers for existing raffles (including Las Vegas)
-- -------------------------------------------------

insert into app_raffle_numbers (raffle_id, number_value, status, source, assigned_offline, created_at, updated_at)
select
  r.id,
  gs.num,
  'available',
  'online',
  false,
  now(),
  now()
from app_raffles r
join lateral generate_series(1, greatest(r.number_pool_size, 1)) as gs(num) on true
on conflict (raffle_id, number_value) do nothing;

update app_raffle_numbers n
set
  status = case
    when e.status = 'confirmed' then 'sold'
    when e.status = 'pending_review' then 'pending_manual_review'
    when e.status = 'pending_payment' then 'reserved'
    when e.status = 'rejected' then 'cancelled'
    when e.status = 'cancelled' then 'cancelled'
    else n.status
  end,
  entry_id = e.id,
  customer_id = e.customer_id,
  customer_email = e.customer_email,
  source = coalesce(e.source, 'online'),
  assigned_offline = coalesce(e.source, 'online') <> 'online',
  payment_method = coalesce(e.payment_method, n.payment_method),
  updated_at = now()
from app_raffle_entries e
where n.raffle_id = e.raffle_id
  and n.number_value = e.chosen_number
  and e.status <> 'rejected';

update app_raffles r
set
  public_participants_enabled = coalesce(public_participants_enabled, true),
  public_participants_mode = coalesce(public_participants_mode, 'masked'),
  public_numbers_visibility = coalesce(public_numbers_visibility, true),
  public_number_grid_mode = coalesce(public_number_grid_mode, 'full'),
  verification_mode = coalesce(verification_mode, 'commit_reveal'),
  draw_algorithm = coalesce(draw_algorithm, 'sha256-modulo-v1'),
  updated_at = now()
where r.title ilike '%las vegas%';

-- -------------------------------------------------
-- RLS policies
-- -------------------------------------------------

alter table app_raffle_numbers enable row level security;
alter table app_raffle_payments enable row level security;
alter table app_raffle_referral_events enable row level security;
alter table app_raffle_admin_logs enable row level security;

drop policy if exists "app_raffles_public_select_published" on app_raffles;
create policy "app_raffles_public_select_published"
on app_raffles for select
using (status in ('published', 'closed'));

drop policy if exists "app_raffles_admin_manage" on app_raffles;
create policy "app_raffles_admin_manage"
on app_raffles for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());

drop policy if exists "app_raffle_entries_admin_manage" on app_raffle_entries;
create policy "app_raffle_entries_admin_manage"
on app_raffle_entries for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());

drop policy if exists "app_raffle_entries_public_select_confirmed" on app_raffle_entries;
create policy "app_raffle_entries_public_select_confirmed"
on app_raffle_entries for select
using (
  exists (
    select 1
    from app_raffles r
    where r.id = app_raffle_entries.raffle_id
      and r.status in ('published', 'closed')
      and r.public_participants_enabled = true
  )
);

drop policy if exists "app_raffle_numbers_admin_manage" on app_raffle_numbers;
create policy "app_raffle_numbers_admin_manage"
on app_raffle_numbers for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());

drop policy if exists "app_raffle_numbers_public_read" on app_raffle_numbers;
create policy "app_raffle_numbers_public_read"
on app_raffle_numbers for select
using (
  exists (
    select 1
    from app_raffles r
    where r.id = app_raffle_numbers.raffle_id
      and r.status in ('published', 'closed')
      and r.public_numbers_visibility = true
  )
);

drop policy if exists "app_raffle_payments_admin_manage" on app_raffle_payments;
create policy "app_raffle_payments_admin_manage"
on app_raffle_payments for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());

drop policy if exists "app_raffle_referral_events_admin_manage" on app_raffle_referral_events;
create policy "app_raffle_referral_events_admin_manage"
on app_raffle_referral_events for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());

drop policy if exists "app_raffle_referral_events_public_insert_click" on app_raffle_referral_events;
create policy "app_raffle_referral_events_public_insert_click"
on app_raffle_referral_events for insert
with check (event_type = 'click');

drop policy if exists "app_raffle_admin_logs_admin_manage" on app_raffle_admin_logs;
create policy "app_raffle_admin_logs_admin_manage"
on app_raffle_admin_logs for all
using (public.is_raffle_admin_role())
with check (public.is_raffle_admin_role());
