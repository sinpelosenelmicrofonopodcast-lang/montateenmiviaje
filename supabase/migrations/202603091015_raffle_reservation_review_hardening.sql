-- Reservation/review/assignment hardening for raffle flows (additive + backward compatible)

do $$
begin
  if to_regclass('public.app_raffle_entries') is null then
    raise notice 'Table public.app_raffle_entries not found; skipping raffle reservation hardening migration.';
  else
    alter table public.app_raffle_entries
      add column if not exists reservation_expires_at timestamptz,
      add column if not exists approved_by uuid,
      add column if not exists approved_at timestamptz,
      add column if not exists payment_verified_at timestamptz,
      add column if not exists verification_notes text,
      add column if not exists rejection_reason text,
      add column if not exists released_at timestamptz,
      add column if not exists released_reason text,
      add column if not exists released_by uuid,
      add column if not exists expiry_reminder_sent_at timestamptz;

    alter table public.app_raffle_entries
      drop constraint if exists app_raffle_entries_status_check;

    alter table public.app_raffle_entries
      add constraint app_raffle_entries_status_check
      check (
        status in (
          'draft',
          'pending_payment',
          'pending_review',
          'approved',
          'assigned',
          'confirmed',
          'rejected',
          'expired',
          'cancelled'
        )
      );

    -- Keep deterministic ownership of a number only while entry is active.
    drop index if exists idx_app_raffle_entries_number_active;
    create unique index if not exists idx_app_raffle_entries_number_active
      on public.app_raffle_entries (raffle_id, chosen_number)
      where status in ('pending_payment', 'pending_review', 'approved', 'assigned', 'confirmed');

    create index if not exists idx_app_raffle_entries_reservation_expiry
      on public.app_raffle_entries (status, reservation_expires_at)
      where status in ('pending_payment', 'pending_review', 'approved');

    create index if not exists idx_app_raffle_entries_release_tracking
      on public.app_raffle_entries (raffle_id, released_at desc)
      where released_at is not null;

    update public.app_raffle_entries
    set reservation_expires_at = now() + interval '30 minutes'
    where status = 'pending_payment'
      and reservation_expires_at is null;

    update public.app_raffle_entries
    set reservation_expires_at = now() + interval '2 hours'
    where status in ('pending_review', 'approved')
      and reservation_expires_at is null;
  end if;
end $$;

-- Extend role checks to include owner and keep admin functions consistent.
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles
      drop constraint if exists profiles_role_check;

    begin
      alter table public.profiles
        add constraint profiles_role_check
        check (role in ('owner', 'super_admin', 'admin', 'manager', 'moderator', 'travel_agent', 'user'));
    exception
      when duplicate_object then
        null;
    end;
  end if;
end $$;

create or replace function public.is_raffle_admin_role()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
  v_allowed boolean;
begin
  v_jwt_role := lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''));
  if v_jwt_role in ('owner', 'super_admin', 'admin') then
    return true;
  end if;

  if to_regclass('public.profiles') is null then
    return false;
  end if;

  execute $sql$
    select exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'super_admin', 'admin')
    )
  $sql$
  into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

create or replace function public.is_notification_admin_role()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
  v_allowed boolean;
begin
  v_jwt_role := lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''));
  if v_jwt_role in ('owner', 'super_admin', 'admin', 'manager', 'moderator') then
    return true;
  end if;

  if to_regclass('public.profiles') is null then
    return false;
  end if;

  execute $sql$
    select exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'super_admin', 'admin', 'manager', 'moderator')
    )
  $sql$
  into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

notify pgrst, 'reload schema';
