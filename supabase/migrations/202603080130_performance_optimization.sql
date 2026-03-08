-- Performance optimization pass (safe, additive)

-- Faster due-draw scanner:
-- WHERE status IN ('published','closed') AND drawn_at IS NULL AND draw_at <= now()
create index if not exists idx_app_raffles_due_draw_scan
  on app_raffles (draw_at)
  where status in ('published', 'closed') and drawn_at is null;

-- Common raffle number listing path:
-- WHERE raffle_id = ? ORDER BY number_value
create index if not exists idx_app_raffle_numbers_raffle_number
  on app_raffle_numbers (raffle_id, number_value);

-- Payments list in admin:
-- WHERE raffle_id = ? ORDER BY created_at desc
create index if not exists idx_app_raffle_payments_raffle_created
  on app_raffle_payments (raffle_id, created_at desc);

-- Global/admin entries list sorted by created_at desc
create index if not exists idx_app_raffle_entries_created_desc
  on app_raffle_entries (created_at desc);
