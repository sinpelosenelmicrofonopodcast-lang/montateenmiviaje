-- Compatibility patch for environments where app_raffles is behind latest schema.
-- Safe to run multiple times.

do $$
begin
  if to_regclass('public.app_raffles') is null then
    raise notice 'Table public.app_raffles not found; skipping compatibility patch.';
    return;
  end if;

  alter table public.app_raffles
    add column if not exists verification_version text,
    add column if not exists verification_status text default 'pending',
    add column if not exists draw_secret text,
    add column if not exists draw_hash text,
    add column if not exists winning_index integer,
    add column if not exists total_tickets integer,
    add column if not exists sales_closed_at timestamptz,
    add column if not exists winner_published_at timestamptz,
    add column if not exists is_legacy boolean default false;

  update public.app_raffles
  set
    verification_version = coalesce(nullif(verification_version, ''), 'sha256-modulo-v1'),
    verification_status = coalesce(nullif(verification_status, ''), 'pending'),
    is_legacy = coalesce(is_legacy, false);

  create index if not exists idx_app_raffles_verification_status_compat
    on public.app_raffles (verification_status, draw_at desc);

  create index if not exists idx_app_raffles_draw_hash_compat
    on public.app_raffles (draw_hash);
end $$;

-- Force PostgREST schema cache refresh in Supabase.
notify pgrst, 'reload schema';
