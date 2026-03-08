-- Allow one customer to purchase multiple raffle numbers in the same raffle.
-- Backward-compatible and safe for partially migrated databases.

do $$
begin
  if to_regclass('public.app_raffle_entries') is null then
    if to_regclass('public.app_raffles') is not null and to_regclass('public.app_customers') is not null then
      create table public.app_raffle_entries (
        id uuid primary key default gen_random_uuid(),
        raffle_id uuid not null references public.app_raffles(id) on delete cascade,
        customer_id uuid not null references public.app_customers(id) on delete cascade,
        customer_email text not null,
        chosen_number int not null check (chosen_number > 0),
        payment_reference text,
        note text,
        status text not null default 'pending_payment'
          check (status in ('pending_payment', 'pending_review', 'confirmed', 'rejected', 'cancelled')),
        source text not null default 'online'
          check (source in ('online', 'offline', 'admin_manual')),
        public_display_name text,
        consent_public_listing boolean not null default false,
        payment_method text,
        phone text,
        referral_code text,
        referred_by_code text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    else
      raise notice 'Skipping app_raffle_entries creation because dependencies are missing (app_raffles/app_customers).';
    end if;
  end if;

  if to_regclass('public.app_raffle_entries') is not null then
    alter table public.app_raffle_entries
      add column if not exists source text not null default 'online',
      add column if not exists public_display_name text,
      add column if not exists consent_public_listing boolean not null default false,
      add column if not exists payment_method text,
      add column if not exists phone text,
      add column if not exists referral_code text,
      add column if not exists referred_by_code text,
      add column if not exists updated_at timestamptz not null default now();

    alter table public.app_raffle_entries
      drop constraint if exists app_raffle_entries_raffle_id_customer_id_key;

    create unique index if not exists idx_app_raffle_entries_number_active
      on public.app_raffle_entries (raffle_id, chosen_number)
      where status <> 'rejected';

    create index if not exists idx_app_raffle_entries_raffle_status
      on public.app_raffle_entries (raffle_id, status);

    create index if not exists idx_app_raffle_entries_customer_raffle_status
      on public.app_raffle_entries (customer_id, raffle_id, status, created_at desc);
  end if;
end $$;

notify pgrst, 'reload schema';
