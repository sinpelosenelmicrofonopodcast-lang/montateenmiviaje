-- Raffle verification hardening (incremental, backward compatible)

alter table if exists app_raffles
  add column if not exists verification_version text not null default 'sha256-modulo-v1',
  add column if not exists verification_status text not null default 'pending',
  add column if not exists draw_secret text,
  add column if not exists draw_hash text,
  add column if not exists winning_index int,
  add column if not exists total_tickets int,
  add column if not exists sales_closed_at timestamptz,
  add column if not exists winner_published_at timestamptz,
  add column if not exists is_legacy boolean not null default false;

alter table if exists app_raffles
  drop constraint if exists app_raffles_verification_status_check;

alter table if exists app_raffles
  add constraint app_raffles_verification_status_check
  check (
    verification_status in (
      'pending',
      'prepared',
      'sales_closed',
      'drawn',
      'winner_published',
      'verified',
      'legacy',
      'cancelled',
      'failed'
    )
  );

create index if not exists idx_app_raffles_verification_status
  on app_raffles(verification_status, draw_at desc);

create index if not exists idx_app_raffles_drawn_hash
  on app_raffles(drawn_at desc, draw_hash);

update app_raffles
set
  verification_version = coalesce(
    nullif(verification_version, ''),
    nullif(draw_payload_json->>'verification_version', ''),
    'sha256-modulo-v1'
  ),
  draw_secret = coalesce(
    nullif(draw_secret, ''),
    nullif(draw_payload_json->>'draw_secret', ''),
    nullif(draw_payload_json->>'reveal_secret', '')
  ),
  draw_hash = coalesce(
    nullif(draw_hash, ''),
    nullif(draw_payload_json->>'draw_hash', '')
  ),
  winning_index = coalesce(
    winning_index,
    nullif(draw_payload_json->>'winner_index', '')::int
  ),
  total_tickets = coalesce(
    total_tickets,
    nullif(draw_payload_json->>'total_tickets', '')::int
  ),
  sales_closed_at = coalesce(
    sales_closed_at,
    nullif(draw_payload_json->>'sales_closed_at', '')::timestamptz
  ),
  winner_published_at = coalesce(
    winner_published_at,
    nullif(draw_payload_json->>'winner_published_at', '')::timestamptz
  ),
  is_legacy = coalesce(
    is_legacy,
    nullif(draw_payload_json->>'is_legacy', '')::boolean,
    verification_mode = 'none'
  );

update app_raffles
set verification_status = case
  when is_legacy then 'legacy'
  when status = 'draft' then 'pending'
  when winner_published_at is not null then 'winner_published'
  when drawn_at is not null then 'drawn'
  when sales_closed_at is not null then 'sales_closed'
  when secret_commit_hash is not null then 'prepared'
  when status = 'closed' then 'sales_closed'
  else 'pending'
end;

create or replace view raffle_audit_logs as
select
  id,
  raffle_id,
  actor_id as actor_user_id,
  action,
  entity_type,
  entity_id,
  metadata_json,
  created_at
from app_raffle_admin_logs;
