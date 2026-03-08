-- Notification orchestrator (push + email + inbox), additive and backward-compatible

create extension if not exists "pgcrypto";

-- Safety bootstrap for environments where profiles was not created yet.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user',
  full_name text,
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists role text not null default 'user',
  add column if not exists full_name text,
  add column if not exists account_status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('super_admin', 'admin', 'manager', 'moderator', 'travel_agent', 'user'));
  end if;
end $$;

create or replace function public.is_notification_admin_role()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
begin
  v_jwt_role := lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''));
  if v_jwt_role in ('super_admin', 'admin', 'manager', 'moderator') then
    return true;
  end if;

  if to_regclass('public.profiles') is not null then
    return exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'admin', 'manager', 'moderator')
    );
  end if;

  return false;
end;
$$;

create table if not exists app_notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text,
  entity_id text,
  actor_user_id uuid references public.profiles(id) on delete set null,
  recipient_scope text not null default 'targeted'
    check (recipient_scope in ('broadcast', 'targeted', 'mixed', 'system')),
  dedupe_key text,
  payload jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references app_notification_events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  kind text not null default 'system',
  channel_summary jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists app_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references app_notification_events(id) on delete cascade,
  notification_id uuid references app_notifications(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null check (channel in ('push', 'email', 'inbox')),
  provider text,
  destination text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'delivered', 'failed', 'skipped')),
  request_payload jsonb not null default '{}'::jsonb,
  provider_response jsonb not null default '{}'::jsonb,
  error text,
  attempt_count int not null default 1 check (attempt_count > 0),
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_user_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  marketing_push_enabled boolean not null default true,
  marketing_email_enabled boolean not null default true,
  transactional_push_enabled boolean not null default true,
  transactional_email_enabled boolean not null default true,
  raffle_push_enabled boolean not null default true,
  raffle_email_enabled boolean not null default true,
  trip_push_enabled boolean not null default true,
  trip_email_enabled boolean not null default true,
  payment_push_enabled boolean not null default true,
  payment_email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_notification_events_created
  on app_notification_events(created_at desc);

create index if not exists idx_app_notification_events_type_created
  on app_notification_events(event_type, created_at desc);

create index if not exists idx_app_notification_events_scope_created
  on app_notification_events(recipient_scope, created_at desc);

create unique index if not exists idx_app_notification_events_dedupe_key
  on app_notification_events(dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_app_notifications_user_read_created
  on app_notifications(user_id, is_read, created_at desc);

create index if not exists idx_app_notifications_event
  on app_notifications(event_id, created_at desc);

create index if not exists idx_app_notification_deliveries_event_channel
  on app_notification_deliveries(event_id, channel, status, created_at desc);

create index if not exists idx_app_notification_deliveries_user_created
  on app_notification_deliveries(user_id, created_at desc);

create index if not exists idx_app_notification_deliveries_status_created
  on app_notification_deliveries(status, created_at desc);

create or replace function public.set_notification_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_notification_deliveries_set_updated_at on app_notification_deliveries;
create trigger app_notification_deliveries_set_updated_at
before update on app_notification_deliveries
for each row execute procedure public.set_notification_updated_at();

drop trigger if exists app_user_notification_preferences_set_updated_at on app_user_notification_preferences;
create trigger app_user_notification_preferences_set_updated_at
before update on app_user_notification_preferences
for each row execute procedure public.set_notification_updated_at();

alter table app_notification_events enable row level security;
alter table app_notifications enable row level security;
alter table app_notification_deliveries enable row level security;
alter table app_user_notification_preferences enable row level security;

drop policy if exists "notifications_owner_read" on app_notifications;
create policy "notifications_owner_read"
on app_notifications for select
using (user_id = auth.uid());

drop policy if exists "notifications_owner_update" on app_notifications;
create policy "notifications_owner_update"
on app_notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_admin_all" on app_notifications;
create policy "notifications_admin_all"
on app_notifications for all
using (public.is_notification_admin_role())
with check (public.is_notification_admin_role());

drop policy if exists "notification_events_admin_read" on app_notification_events;
create policy "notification_events_admin_read"
on app_notification_events for select
using (public.is_notification_admin_role());

drop policy if exists "notification_events_admin_manage" on app_notification_events;
create policy "notification_events_admin_manage"
on app_notification_events for all
using (public.is_notification_admin_role())
with check (public.is_notification_admin_role());

drop policy if exists "notification_deliveries_owner_read" on app_notification_deliveries;
create policy "notification_deliveries_owner_read"
on app_notification_deliveries for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from app_notifications n
    where n.id = app_notification_deliveries.notification_id
      and n.user_id = auth.uid()
  )
);

drop policy if exists "notification_deliveries_admin_all" on app_notification_deliveries;
create policy "notification_deliveries_admin_all"
on app_notification_deliveries for all
using (public.is_notification_admin_role())
with check (public.is_notification_admin_role());

drop policy if exists "notification_preferences_owner_read" on app_user_notification_preferences;
create policy "notification_preferences_owner_read"
on app_user_notification_preferences for select
using (user_id = auth.uid());

drop policy if exists "notification_preferences_owner_manage" on app_user_notification_preferences;
create policy "notification_preferences_owner_manage"
on app_user_notification_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_admin_all" on app_user_notification_preferences;
create policy "notification_preferences_admin_all"
on app_user_notification_preferences for all
using (public.is_notification_admin_role())
with check (public.is_notification_admin_role());

create or replace view app_notification_delivery_summary_v as
select
  d.channel,
  d.status,
  count(*)::int as total
from app_notification_deliveries d
group by d.channel, d.status;
