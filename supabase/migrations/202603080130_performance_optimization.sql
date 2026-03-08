-- Performance optimization pass (safe, additive)
-- Note: this migration is resilient if some raffle tables do not exist yet.

do $$
begin
  -- Faster due-draw scanner:
  -- WHERE status IN ('published','closed') AND drawn_at IS NULL AND draw_at <= now()
  if to_regclass('public.app_raffles') is not null then
    execute '
      create index if not exists idx_app_raffles_due_draw_scan
      on app_raffles (draw_at)
      where status in (''published'', ''closed'') and drawn_at is null
    ';
  end if;

  -- Common raffle number listing path:
  -- WHERE raffle_id = ? ORDER BY number_value
  if to_regclass('public.app_raffle_numbers') is not null then
    execute '
      create index if not exists idx_app_raffle_numbers_raffle_number
      on app_raffle_numbers (raffle_id, number_value)
    ';
  end if;

  -- Payments list in admin:
  -- WHERE raffle_id = ? ORDER BY created_at desc
  if to_regclass('public.app_raffle_payments') is not null then
    execute '
      create index if not exists idx_app_raffle_payments_raffle_created
      on app_raffle_payments (raffle_id, created_at desc)
    ';
  end if;

  -- Global/admin entries list sorted by created_at desc
  if to_regclass('public.app_raffle_entries') is not null then
    execute '
      create index if not exists idx_app_raffle_entries_created_desc
      on app_raffle_entries (created_at desc)
    ';
  end if;
end $$;
