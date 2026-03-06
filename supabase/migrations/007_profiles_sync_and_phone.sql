-- Keep profiles in sync with auth.users and persist phone for role management UI

alter table if exists public.profiles
  add column if not exists phone text;

update public.profiles
set role = 'user'
where role is null;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    phone,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, concat(new.id::text, '@no-email.local')),
    coalesce(new.raw_user_meta_data->>'phone', null),
    'user',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile
after insert on auth.users
for each row execute function public.sync_profile_from_auth_user();

drop trigger if exists on_auth_user_updated_sync_profile on auth.users;
create trigger on_auth_user_updated_sync_profile
after update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (
  id,
  email,
  phone,
  role,
  created_at,
  updated_at
)
select
  au.id,
  coalesce(au.email, concat(au.id::text, '@no-email.local')),
  coalesce(au.raw_user_meta_data->>'phone', null),
  coalesce(p.role, 'user'),
  coalesce(p.created_at, now()),
  now()
from auth.users au
left join public.profiles p on p.id = au.id
on conflict (id) do update
set
  email = excluded.email,
  phone = coalesce(excluded.phone, public.profiles.phone),
  updated_at = now();
