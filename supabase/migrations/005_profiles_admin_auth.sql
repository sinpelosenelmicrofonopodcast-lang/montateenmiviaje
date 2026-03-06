-- Hidden admin auth model based on profiles role

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'manager', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'manager', 'user'));
  end if;
end $$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_self_insert_user_role" on public.profiles;
create policy "profiles_self_insert_user_role"
on public.profiles
for insert
with check (
  auth.uid() = id
  and role = 'user'
);

drop policy if exists "profiles_self_update_without_role_escalation" on public.profiles;
create policy "profiles_self_update_without_role_escalation"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all"
on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
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
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create index if not exists idx_profiles_role on public.profiles(role);
