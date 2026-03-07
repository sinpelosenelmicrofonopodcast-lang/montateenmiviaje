-- Growth + traveler profile + referral + onboarding system (incremental, compatibility-safe)

create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- Profiles expansion (compatible with existing table)
-- -------------------------------------------------

alter table if exists public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists full_name text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists date_of_birth date,
  add column if not exists preferred_language text not null default 'es',
  add column if not exists avatar_url text,
  add column if not exists account_status text not null default 'active',
  add column if not exists registration_source text not null default 'organic',
  add column if not exists referred_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists referred_by_code text,
  add column if not exists home_airport_code text,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists profile_completed boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('active', 'pending', 'suspended', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_preferred_language_check'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_language_check
      check (preferred_language in ('es', 'en'));
  end if;
end $$;

create index if not exists idx_profiles_profile_completed on public.profiles(profile_completed);
create index if not exists idx_profiles_account_status on public.profiles(account_status);
create index if not exists idx_profiles_referred_by_code on public.profiles(referred_by_code);
create index if not exists idx_profiles_referred_by_user_id on public.profiles(referred_by_user_id);

-- -------------------------------------------------
-- New tables
-- -------------------------------------------------

create table if not exists app_traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,
  date_of_birth date,
  gender text,
  relationship_to_user text,
  nationality text,
  passport_number text,
  passport_issuing_country text,
  passport_expiration_date date,
  known_traveler_number text,
  redress_number text,
  loyalty_programs jsonb not null default '[]'::jsonb,
  special_assistance_notes text,
  meal_preferences text,
  seat_preferences text,
  traveler_type text not null default 'adult',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (traveler_type in ('adult', 'child', 'infant')),
  check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')),
  check (relationship_to_user is null or relationship_to_user in ('self', 'spouse', 'partner', 'child', 'family', 'friend', 'other'))
);

create index if not exists idx_app_traveler_profiles_user on app_traveler_profiles(user_id, created_at desc);
create unique index if not exists idx_app_traveler_profiles_default
  on app_traveler_profiles(user_id)
  where is_default = true;

create table if not exists app_traveler_documents (
  id uuid primary key default gen_random_uuid(),
  traveler_profile_id uuid not null references app_traveler_profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  issuing_country text,
  document_number text,
  expires_at date,
  encrypted_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (document_type in ('passport', 'id_card', 'visa', 'known_traveler', 'other'))
);

create index if not exists idx_app_traveler_documents_user on app_traveler_documents(user_id, created_at desc);
create index if not exists idx_app_traveler_documents_profile on app_traveler_documents(traveler_profile_id);

create table if not exists app_traveler_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  preferred_destinations text[] not null default '{}',
  dream_destinations text[] not null default '{}',
  preferred_airlines text[] not null default '{}',
  preferred_hotel_style text,
  preferred_trip_types text[] not null default '{}',
  preferred_departure_airports text[] not null default '{}',
  typical_trip_duration_days int,
  preferred_travel_months int[] not null default '{}',
  usually_travels_with text,
  travel_frequency_per_year int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_max >= 0),
  check (typical_trip_duration_days is null or typical_trip_duration_days > 0),
  check (travel_frequency_per_year is null or travel_frequency_per_year >= 0)
);

create table if not exists app_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_name text not null,
  relationship text not null,
  phone text not null,
  email text,
  country text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_emergency_contacts_user on app_emergency_contacts(user_id, created_at desc);
create unique index if not exists idx_app_emergency_contacts_primary
  on app_emergency_contacts(user_id)
  where is_primary = true;

create table if not exists app_referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null unique,
  share_slug text not null unique,
  status text not null default 'active',
  clicks_count int not null default 0,
  signups_count int not null default 0,
  conversions_count int not null default 0,
  reward_points_earned numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'paused', 'blocked')),
  check (clicks_count >= 0),
  check (signups_count >= 0),
  check (conversions_count >= 0),
  check (reward_points_earned >= 0)
);

create table if not exists app_referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references app_referral_codes(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    event_type in (
      'link_clicked',
      'signup_started',
      'signup_completed',
      'email_verified',
      'first_profile_completed',
      'first_quote_requested',
      'first_booking_completed',
      'reward_issued'
    )
  )
);

create index if not exists idx_app_referral_events_referrer
  on app_referral_events(referrer_user_id, created_at desc);
create index if not exists idx_app_referral_events_referred
  on app_referral_events(referred_user_id, created_at desc);
create index if not exists idx_app_referral_events_code_event
  on app_referral_events(referral_code_id, event_type, created_at desc);
create unique index if not exists idx_app_referral_events_unique_user_event
  on app_referral_events(referral_code_id, referred_user_id, event_type)
  where referred_user_id is not null
    and event_type in ('signup_completed', 'email_verified', 'first_profile_completed', 'first_quote_requested', 'first_booking_completed');

create table if not exists app_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  referral_event_id uuid references app_referral_events(id) on delete set null,
  reward_type text not null,
  reward_value numeric(12,2) not null default 0,
  reward_status text not null default 'pending',
  description text,
  issued_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  check (reward_type in ('credit', 'discount', 'points', 'cashback', 'promo_access', 'manual')),
  check (reward_status in ('pending', 'issued', 'redeemed', 'cancelled')),
  check (reward_value >= 0)
);

create index if not exists idx_app_referral_rewards_user_status
  on app_referral_rewards(user_id, reward_status, created_at desc);
create unique index if not exists idx_app_referral_rewards_unique_event
  on app_referral_rewards(referral_event_id)
  where referral_event_id is not null;

create table if not exists app_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  account_created boolean not null default true,
  email_verified boolean not null default false,
  basic_profile_completed boolean not null default false,
  traveler_added boolean not null default false,
  preferences_completed boolean not null default false,
  referral_prompt_seen boolean not null default false,
  first_quote_requested boolean not null default false,
  onboarding_completed boolean not null default false,
  completion_percentage int not null default 0,
  current_step text not null default 'welcome',
  last_completed_step text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (completion_percentage between 0 and 100)
);

create index if not exists idx_app_onboarding_progress_completion
  on app_onboarding_progress(onboarding_completed, completion_percentage);

create table if not exists app_user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_user_activity_user_created
  on app_user_activity_log(user_id, created_at desc);

create table if not exists app_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  search_type text not null,
  destination text,
  filters_json jsonb not null default '{}'::jsonb,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (search_type in ('trips', 'flights', 'hotels', 'raffles', 'offers'))
);

create index if not exists idx_app_saved_searches_user
  on app_saved_searches(user_id, created_at desc);

create table if not exists app_saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_slug text not null references app_trips(slug) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, trip_slug)
);

create index if not exists idx_app_saved_trips_user_created
  on app_saved_trips(user_id, created_at desc);

-- -------------------------------------------------
-- Functions and triggers
-- -------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_growth_admin_role()
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

create or replace function public.sync_profile_identity_fields()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email := lower(trim(new.email));
  end if;

  if (new.full_name is null or length(trim(new.full_name)) = 0)
    and (new.first_name is not null or new.last_name is not null) then
    new.full_name := nullif(trim(concat_ws(' ', new.first_name, new.last_name)), '');
  end if;

  if (new.first_name is null or length(trim(new.first_name)) = 0)
    and new.full_name is not null
    and length(trim(new.full_name)) > 0 then
    new.first_name := split_part(trim(new.full_name), ' ', 1);
  end if;

  if (new.last_name is null or length(trim(new.last_name)) = 0)
    and new.full_name is not null
    and length(trim(new.full_name)) > 0 then
    new.last_name := nullif(trim(regexp_replace(trim(new.full_name), '^\\S+\\s*', '')), '');
  end if;

  if new.home_airport_code is not null then
    new.home_airport_code := upper(trim(new.home_airport_code));
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.generate_unique_referral_code(p_seed text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_code text;
  v_attempt int := 0;
begin
  v_base := upper(regexp_replace(coalesce(nullif(trim(p_seed), ''), 'MONTATE'), '[^A-Z0-9]+', '', 'g'));
  if length(v_base) < 4 then
    v_base := 'MONTATE';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := left(v_base, 8) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    exit when not exists (
      select 1 from app_referral_codes rc where rc.referral_code = v_code
    );
    exit when v_attempt > 25;
  end loop;

  return v_code;
end;
$$;

create or replace function public.ensure_referral_code_for_user(p_user_id uuid)
returns app_referral_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing app_referral_codes;
  v_profile profiles%rowtype;
  v_code text;
begin
  select * into v_existing from app_referral_codes where user_id = p_user_id;
  if v_existing.id is not null then
    return v_existing;
  end if;

  select * into v_profile from profiles where id = p_user_id;
  if v_profile.id is null then
    raise exception 'Perfil no encontrado para %', p_user_id;
  end if;

  v_code := public.generate_unique_referral_code(coalesce(v_profile.first_name, split_part(v_profile.email, '@', 1)));

  insert into app_referral_codes (
    user_id,
    referral_code,
    share_slug,
    status,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    v_code,
    lower(v_code),
    'active',
    now(),
    now()
  )
  returning * into v_existing;

  return v_existing;
end;
$$;

create or replace function public.track_referral_event(
  p_referral_code text,
  p_event_type text,
  p_referred_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code app_referral_codes%rowtype;
  v_event_id uuid;
begin
  select * into v_code
  from app_referral_codes
  where referral_code = upper(trim(p_referral_code))
    and status = 'active';

  if v_code.id is null then
    return null;
  end if;

  if p_referred_user_id is not null and v_code.user_id = p_referred_user_id then
    return null;
  end if;

  insert into app_referral_events (
    referral_code_id,
    referrer_user_id,
    referred_user_id,
    event_type,
    event_metadata,
    created_at
  )
  values (
    v_code.id,
    v_code.user_id,
    p_referred_user_id,
    p_event_type,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (referral_code_id, referred_user_id, event_type)
  where referred_user_id is not null
    and event_type in ('signup_completed', 'email_verified', 'first_profile_completed', 'first_quote_requested', 'first_booking_completed')
  do update set
    event_metadata = app_referral_events.event_metadata || excluded.event_metadata
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id
    from app_referral_events
    where referral_code_id = v_code.id
      and referred_user_id is not distinct from p_referred_user_id
      and event_type = p_event_type
    order by created_at desc
    limit 1;
  end if;

  update app_referral_codes rc
  set
    clicks_count = (
      select count(*)::int
      from app_referral_events e
      where e.referral_code_id = v_code.id
        and e.event_type = 'link_clicked'
    ),
    signups_count = (
      select count(*)::int
      from app_referral_events e
      where e.referral_code_id = v_code.id
        and e.event_type = 'signup_completed'
    ),
    conversions_count = (
      select count(*)::int
      from app_referral_events e
      where e.referral_code_id = v_code.id
        and e.event_type = 'first_booking_completed'
    ),
    updated_at = now()
  where rc.id = v_code.id;

  return v_event_id;
end;
$$;

create or replace function public.issue_referral_reward_if_eligible(p_referred_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversion_event app_referral_events%rowtype;
  v_reward_id uuid;
begin
  select e.* into v_conversion_event
  from app_referral_events e
  where e.referred_user_id = p_referred_user_id
    and e.event_type = 'first_booking_completed'
  order by e.created_at asc
  limit 1;

  if v_conversion_event.id is null then
    return null;
  end if;

  select id into v_reward_id
  from app_referral_rewards
  where referral_event_id = v_conversion_event.id;

  if v_reward_id is not null then
    return v_reward_id;
  end if;

  insert into app_referral_rewards (
    user_id,
    referral_event_id,
    reward_type,
    reward_value,
    reward_status,
    description,
    issued_at,
    created_at
  )
  values (
    v_conversion_event.referrer_user_id,
    v_conversion_event.id,
    'credit',
    50,
    'issued',
    'Crédito por primera reserva completada de referido',
    now(),
    now()
  )
  returning id into v_reward_id;

  update app_referral_codes
  set reward_points_earned = reward_points_earned + 50,
      updated_at = now()
  where id = v_conversion_event.referral_code_id;

  perform public.track_referral_event(
    (select referral_code from app_referral_codes where id = v_conversion_event.referral_code_id),
    'reward_issued',
    p_referred_user_id,
    jsonb_build_object('reward_id', v_reward_id)
  );

  return v_reward_id;
end;
$$;

create or replace function public.recalc_onboarding_progress(p_user_id uuid)
returns app_onboarding_progress
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile profiles%rowtype;
  v_progress app_onboarding_progress%rowtype;
  v_email_verified boolean := false;
  v_has_traveler boolean := false;
  v_has_preferences boolean := false;
  v_completion int := 0;
  v_current_step text := 'welcome';
begin
  select * into v_profile from public.profiles where id = p_user_id;
  if v_profile.id is null then
    raise exception 'Perfil no encontrado para %', p_user_id;
  end if;

  select (au.email_confirmed_at is not null)
  into v_email_verified
  from auth.users au
  where au.id = p_user_id;

  v_has_traveler := exists (
    select 1 from app_traveler_profiles tp where tp.user_id = p_user_id
  );

  v_has_preferences := exists (
    select 1
    from app_traveler_preferences pref
    where pref.user_id = p_user_id
      and (
        pref.preferred_destinations <> '{}'::text[]
        or pref.dream_destinations <> '{}'::text[]
        or pref.preferred_trip_types <> '{}'::text[]
        or pref.travel_frequency_per_year is not null
        or pref.budget_min is not null
        or pref.budget_max is not null
      )
  );

  insert into app_onboarding_progress (user_id, account_created, created_at, updated_at)
  values (p_user_id, true, now(), now())
  on conflict (user_id) do nothing;

  select * into v_progress
  from app_onboarding_progress
  where user_id = p_user_id;

  v_progress.email_verified := v_email_verified;
  v_progress.basic_profile_completed := (
    coalesce(length(trim(v_profile.first_name)), 0) > 0
    and coalesce(length(trim(v_profile.last_name)), 0) > 0
    and coalesce(length(trim(v_profile.country)), 0) > 0
  );
  v_progress.traveler_added := v_has_traveler;
  v_progress.preferences_completed := v_has_preferences;

  v_completion :=
    (case when v_progress.account_created then 10 else 0 end) +
    (case when v_progress.email_verified then 20 else 0 end) +
    (case when v_progress.basic_profile_completed then 20 else 0 end) +
    (case when v_progress.traveler_added then 20 else 0 end) +
    (case when v_progress.preferences_completed then 15 else 0 end) +
    (case when v_progress.referral_prompt_seen then 5 else 0 end) +
    (case when v_progress.first_quote_requested then 10 else 0 end);

  v_progress.completion_percentage := least(greatest(v_completion, 0), 100);
  v_progress.onboarding_completed := (
    v_progress.email_verified
    and v_progress.basic_profile_completed
    and v_progress.traveler_added
    and v_progress.preferences_completed
  );

  if not v_progress.email_verified then
    v_current_step := 'email_verified';
  elsif not v_progress.basic_profile_completed then
    v_current_step := 'basic_profile_completed';
  elsif not v_progress.preferences_completed then
    v_current_step := 'preferences_completed';
  elsif not v_progress.traveler_added then
    v_current_step := 'traveler_added';
  elsif not v_progress.referral_prompt_seen then
    v_current_step := 'referral_prompt_seen';
  else
    v_current_step := 'onboarding_completed';
  end if;

  update app_onboarding_progress
  set
    account_created = true,
    email_verified = v_progress.email_verified,
    basic_profile_completed = v_progress.basic_profile_completed,
    traveler_added = v_progress.traveler_added,
    preferences_completed = v_progress.preferences_completed,
    referral_prompt_seen = v_progress.referral_prompt_seen,
    first_quote_requested = v_progress.first_quote_requested,
    onboarding_completed = v_progress.onboarding_completed,
    completion_percentage = v_progress.completion_percentage,
    current_step = v_current_step,
    updated_at = now()
  where user_id = p_user_id;

  update public.profiles p
  set profile_completed = (v_progress.completion_percentage >= 70)
  where p.id = p_user_id
    and p.profile_completed is distinct from (v_progress.completion_percentage >= 70);

  select * into v_progress
  from app_onboarding_progress
  where user_id = p_user_id;

  return v_progress;
end;
$$;

create or replace function public.mark_onboarding_step(p_user_id uuid, p_step text)
returns app_onboarding_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step text := lower(trim(coalesce(p_step, '')));
  v_progress app_onboarding_progress%rowtype;
begin
  insert into app_onboarding_progress (user_id, account_created, created_at, updated_at)
  values (p_user_id, true, now(), now())
  on conflict (user_id) do nothing;

  update app_onboarding_progress
  set
    account_created = case when v_step = 'account_created' then true else account_created end,
    email_verified = case when v_step = 'email_verified' then true else email_verified end,
    basic_profile_completed = case when v_step = 'basic_profile_completed' then true else basic_profile_completed end,
    traveler_added = case when v_step = 'traveler_added' then true else traveler_added end,
    preferences_completed = case when v_step = 'preferences_completed' then true else preferences_completed end,
    referral_prompt_seen = case when v_step = 'referral_prompt_seen' then true else referral_prompt_seen end,
    first_quote_requested = case when v_step = 'first_quote_requested' then true else first_quote_requested end,
    onboarding_completed = case when v_step = 'onboarding_completed' then true else onboarding_completed end,
    last_completed_step = v_step,
    updated_at = now()
  where user_id = p_user_id;

  select * into v_progress from public.recalc_onboarding_progress(p_user_id);
  return v_progress;
end;
$$;

create or replace function public.apply_referral_code_to_profile(p_user_id uuid, p_referral_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code app_referral_codes%rowtype;
  v_current profiles%rowtype;
  v_event_id uuid;
begin
  if p_referral_code is null or length(trim(p_referral_code)) < 2 then
    return false;
  end if;

  select * into v_current from profiles where id = p_user_id;
  if v_current.id is null then
    return false;
  end if;

  select * into v_code
  from app_referral_codes
  where referral_code = upper(trim(p_referral_code))
    and status = 'active';

  if v_code.id is null then
    return false;
  end if;

  if v_code.user_id = p_user_id then
    return false;
  end if;

  update profiles
  set
    referred_by_user_id = coalesce(referred_by_user_id, v_code.user_id),
    referred_by_code = coalesce(referred_by_code, v_code.referral_code)
  where id = p_user_id;

  v_event_id := public.track_referral_event(v_code.referral_code, 'signup_completed', p_user_id, '{}'::jsonb);
  return v_event_id is not null;
end;
$$;

create or replace function public.log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into app_user_activity_log (user_id, activity_type, entity_type, entity_id, metadata, created_at)
  values (
    p_user_id,
    coalesce(nullif(trim(p_activity_type), ''), 'unknown'),
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_phone text;
  v_country text;
  v_source text;
begin
  v_first_name := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  v_last_name := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_country := nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), '');
  v_source := nullif(trim(coalesce(new.raw_user_meta_data->>'registration_source', '')), '');

  if v_full_name is null then
    v_full_name := nullif(trim(concat_ws(' ', v_first_name, v_last_name)), '');
  end if;

  insert into public.profiles (
    id,
    email,
    phone,
    first_name,
    last_name,
    full_name,
    country,
    role,
    registration_source,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(lower(trim(new.email)), concat(new.id::text, '@no-email.local')),
    v_phone,
    v_first_name,
    v_last_name,
    v_full_name,
    v_country,
    'user',
    coalesce(v_source, 'auth_signup'),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    phone = coalesce(excluded.phone, public.profiles.phone),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    country = coalesce(excluded.country, public.profiles.country),
    registration_source = coalesce(public.profiles.registration_source, excluded.registration_source),
    updated_at = now();

  perform public.ensure_referral_code_for_user(new.id);
  perform public.recalc_onboarding_progress(new.id);

  return new;
end;
$$;

create or replace function public.sync_traveler_document_user_id()
returns trigger
language plpgsql
as $$
declare
  v_user_id uuid;
begin
  select tp.user_id into v_user_id
  from app_traveler_profiles tp
  where tp.id = new.traveler_profile_id;

  if v_user_id is null then
    raise exception 'Traveler profile no encontrado';
  end if;

  new.user_id := v_user_id;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.recalc_onboarding_for_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalc_onboarding_progress(new.id);
  return new;
end;
$$;

create or replace function public.recalc_onboarding_for_user_id_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  if v_user_id is not null then
    perform public.recalc_onboarding_progress(v_user_id);
  end if;
  return coalesce(new, old);
end;
$$;

-- updated_at triggers

drop trigger if exists set_profiles_identity_fields on public.profiles;
create trigger set_profiles_identity_fields
before insert or update on public.profiles
for each row
execute function public.sync_profile_identity_fields();

drop trigger if exists set_app_traveler_profiles_updated_at on app_traveler_profiles;
create trigger set_app_traveler_profiles_updated_at
before update on app_traveler_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists set_app_traveler_documents_user on app_traveler_documents;
create trigger set_app_traveler_documents_user
before insert or update on app_traveler_documents
for each row execute function public.sync_traveler_document_user_id();

drop trigger if exists set_app_traveler_preferences_updated_at on app_traveler_preferences;
create trigger set_app_traveler_preferences_updated_at
before update on app_traveler_preferences
for each row execute function public.touch_updated_at();

drop trigger if exists set_app_emergency_contacts_updated_at on app_emergency_contacts;
create trigger set_app_emergency_contacts_updated_at
before update on app_emergency_contacts
for each row execute function public.touch_updated_at();

drop trigger if exists set_app_referral_codes_updated_at on app_referral_codes;
create trigger set_app_referral_codes_updated_at
before update on app_referral_codes
for each row execute function public.touch_updated_at();

drop trigger if exists set_app_onboarding_progress_updated_at on app_onboarding_progress;
create trigger set_app_onboarding_progress_updated_at
before update on app_onboarding_progress
for each row execute function public.touch_updated_at();

drop trigger if exists set_app_saved_searches_updated_at on app_saved_searches;
create trigger set_app_saved_searches_updated_at
before update on app_saved_searches
for each row execute function public.touch_updated_at();

-- onboarding recalculation triggers

drop trigger if exists after_profiles_recalc_onboarding on public.profiles;
create trigger after_profiles_recalc_onboarding
after insert or update of first_name, last_name, full_name, country, city, state_region, date_of_birth, preferred_language, home_airport_code, profile_completed
on public.profiles
for each row
execute function public.recalc_onboarding_for_profile_trigger();

drop trigger if exists after_traveler_profiles_recalc_onboarding on app_traveler_profiles;
create trigger after_traveler_profiles_recalc_onboarding
after insert or update or delete on app_traveler_profiles
for each row
execute function public.recalc_onboarding_for_user_id_trigger();

drop trigger if exists after_traveler_preferences_recalc_onboarding on app_traveler_preferences;
create trigger after_traveler_preferences_recalc_onboarding
after insert or update or delete on app_traveler_preferences
for each row
execute function public.recalc_onboarding_for_user_id_trigger();

-- -------------------------------------------------
-- RLS and policies
-- -------------------------------------------------

alter table app_traveler_profiles enable row level security;
alter table app_traveler_documents enable row level security;
alter table app_traveler_preferences enable row level security;
alter table app_emergency_contacts enable row level security;
alter table app_referral_codes enable row level security;
alter table app_referral_events enable row level security;
alter table app_referral_rewards enable row level security;
alter table app_onboarding_progress enable row level security;
alter table app_user_activity_log enable row level security;
alter table app_saved_searches enable row level security;
alter table app_saved_trips enable row level security;

-- traveler profiles

drop policy if exists "traveler_profiles_owner_read" on app_traveler_profiles;
create policy "traveler_profiles_owner_read"
on app_traveler_profiles for select
using (auth.uid() = user_id);

drop policy if exists "traveler_profiles_owner_manage" on app_traveler_profiles;
create policy "traveler_profiles_owner_manage"
on app_traveler_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "traveler_profiles_admin_manage" on app_traveler_profiles;
create policy "traveler_profiles_admin_manage"
on app_traveler_profiles for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- traveler documents

drop policy if exists "traveler_documents_owner_read" on app_traveler_documents;
create policy "traveler_documents_owner_read"
on app_traveler_documents for select
using (auth.uid() = user_id);

drop policy if exists "traveler_documents_owner_manage" on app_traveler_documents;
create policy "traveler_documents_owner_manage"
on app_traveler_documents for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "traveler_documents_admin_manage" on app_traveler_documents;
create policy "traveler_documents_admin_manage"
on app_traveler_documents for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- traveler preferences

drop policy if exists "traveler_preferences_owner_read" on app_traveler_preferences;
create policy "traveler_preferences_owner_read"
on app_traveler_preferences for select
using (auth.uid() = user_id);

drop policy if exists "traveler_preferences_owner_manage" on app_traveler_preferences;
create policy "traveler_preferences_owner_manage"
on app_traveler_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "traveler_preferences_admin_manage" on app_traveler_preferences;
create policy "traveler_preferences_admin_manage"
on app_traveler_preferences for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- emergency contacts

drop policy if exists "emergency_contacts_owner_read" on app_emergency_contacts;
create policy "emergency_contacts_owner_read"
on app_emergency_contacts for select
using (auth.uid() = user_id);

drop policy if exists "emergency_contacts_owner_manage" on app_emergency_contacts;
create policy "emergency_contacts_owner_manage"
on app_emergency_contacts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "emergency_contacts_admin_manage" on app_emergency_contacts;
create policy "emergency_contacts_admin_manage"
on app_emergency_contacts for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- referral codes

drop policy if exists "referral_codes_owner_read" on app_referral_codes;
create policy "referral_codes_owner_read"
on app_referral_codes for select
using (auth.uid() = user_id);

drop policy if exists "referral_codes_owner_manage" on app_referral_codes;
create policy "referral_codes_owner_manage"
on app_referral_codes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "referral_codes_admin_manage" on app_referral_codes;
create policy "referral_codes_admin_manage"
on app_referral_codes for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- referral events

drop policy if exists "referral_events_owner_read" on app_referral_events;
create policy "referral_events_owner_read"
on app_referral_events for select
using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "referral_events_owner_insert" on app_referral_events;
create policy "referral_events_owner_insert"
on app_referral_events for insert
with check (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "referral_events_admin_manage" on app_referral_events;
create policy "referral_events_admin_manage"
on app_referral_events for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- referral rewards

drop policy if exists "referral_rewards_owner_read" on app_referral_rewards;
create policy "referral_rewards_owner_read"
on app_referral_rewards for select
using (auth.uid() = user_id);

drop policy if exists "referral_rewards_admin_manage" on app_referral_rewards;
create policy "referral_rewards_admin_manage"
on app_referral_rewards for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- onboarding

drop policy if exists "onboarding_owner_read" on app_onboarding_progress;
create policy "onboarding_owner_read"
on app_onboarding_progress for select
using (auth.uid() = user_id);

drop policy if exists "onboarding_owner_manage" on app_onboarding_progress;
create policy "onboarding_owner_manage"
on app_onboarding_progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "onboarding_admin_manage" on app_onboarding_progress;
create policy "onboarding_admin_manage"
on app_onboarding_progress for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- activity log

drop policy if exists "activity_owner_read" on app_user_activity_log;
create policy "activity_owner_read"
on app_user_activity_log for select
using (auth.uid() = user_id);

drop policy if exists "activity_owner_insert" on app_user_activity_log;
create policy "activity_owner_insert"
on app_user_activity_log for insert
with check (auth.uid() = user_id);

drop policy if exists "activity_admin_manage" on app_user_activity_log;
create policy "activity_admin_manage"
on app_user_activity_log for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- saved searches

drop policy if exists "saved_searches_owner_manage" on app_saved_searches;
create policy "saved_searches_owner_manage"
on app_saved_searches for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "saved_searches_admin_manage" on app_saved_searches;
create policy "saved_searches_admin_manage"
on app_saved_searches for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- saved trips

drop policy if exists "saved_trips_owner_manage" on app_saved_trips;
create policy "saved_trips_owner_manage"
on app_saved_trips for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "saved_trips_admin_manage" on app_saved_trips;
create policy "saved_trips_admin_manage"
on app_saved_trips for all
using (public.is_growth_admin_role())
with check (public.is_growth_admin_role());

-- -------------------------------------------------
-- Admin views
-- -------------------------------------------------

create or replace view app_referral_performance_v as
select
  rc.user_id,
  p.email,
  coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name), p.email) as full_name,
  rc.referral_code,
  rc.status,
  rc.clicks_count,
  rc.signups_count,
  rc.conversions_count,
  rc.reward_points_earned,
  rc.created_at,
  rc.updated_at
from app_referral_codes rc
left join public.profiles p on p.id = rc.user_id;

create or replace view app_onboarding_funnel_v as
select
  count(*)::int as total_users,
  count(*) filter (where account_created)::int as account_created,
  count(*) filter (where email_verified)::int as email_verified,
  count(*) filter (where basic_profile_completed)::int as basic_profile_completed,
  count(*) filter (where preferences_completed)::int as preferences_completed,
  count(*) filter (where traveler_added)::int as traveler_added,
  count(*) filter (where first_quote_requested)::int as first_quote_requested,
  count(*) filter (where onboarding_completed)::int as onboarding_completed,
  coalesce(round(avg(completion_percentage)::numeric, 2), 0)::numeric(5,2) as avg_completion_percentage
from app_onboarding_progress;

create or replace view app_profile_completion_v as
select
  p.id as user_id,
  p.email,
  coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name), p.email) as full_name,
  p.role,
  p.account_status,
  p.profile_completed,
  op.completion_percentage,
  op.current_step,
  op.onboarding_completed,
  op.updated_at as onboarding_updated_at,
  (select count(*)::int from app_traveler_profiles tp where tp.user_id = p.id) as travelers_count,
  exists(select 1 from app_traveler_preferences pref where pref.user_id = p.id) as has_preferences
from public.profiles p
left join app_onboarding_progress op on op.user_id = p.id;

-- -------------------------------------------------
-- Backfill for existing users
-- -------------------------------------------------

update public.profiles p
set
  first_name = coalesce(nullif(trim(p.first_name), ''), split_part(coalesce(c.full_name, p.email), ' ', 1)),
  last_name = coalesce(
    nullif(trim(p.last_name), ''),
    nullif(trim(regexp_replace(coalesce(c.full_name, ''), '^\\S+\\s*', '')), '')
  ),
  full_name = coalesce(
    nullif(trim(p.full_name), ''),
    nullif(trim(c.full_name), ''),
    nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
    split_part(p.email, '@', 1)
  ),
  country = coalesce(nullif(trim(p.country), ''), nullif(trim(c.country), ''), 'US'),
  registration_source = coalesce(nullif(trim(p.registration_source), ''), 'legacy')
from app_customers c
where c.auth_user_id = p.id
   or lower(c.email) = lower(p.email);

insert into app_onboarding_progress (user_id, account_created, created_at, updated_at)
select p.id, true, now(), now()
from public.profiles p
on conflict (user_id) do nothing;

with missing as (
  select
    p.id as user_id,
    public.generate_unique_referral_code(coalesce(p.first_name, split_part(p.email, '@', 1))) as code
  from public.profiles p
  where not exists (
    select 1 from app_referral_codes rc where rc.user_id = p.id
  )
)
insert into app_referral_codes (
  user_id,
  referral_code,
  share_slug,
  status,
  clicks_count,
  signups_count,
  conversions_count,
  reward_points_earned,
  created_at,
  updated_at
)
select
  m.user_id,
  m.code,
  lower(m.code),
  'active',
  0,
  0,
  0,
  0,
  now(),
  now()
from missing m
on conflict (user_id) do nothing;

-- recalculate onboarding and completion for existing users
select public.recalc_onboarding_progress(p.id)
from public.profiles p;
