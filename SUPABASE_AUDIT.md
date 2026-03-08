# Supabase Audit

## Data access pattern snapshot
Main read/write concentration:
- `lib/raffles-service.ts`
- Admin raffle APIs under `app/api/admin/raffles/*`
- Public raffle APIs under `app/api/raffles/*`

## Key findings
1. **Due-draw scanner repeated too frequently**
- Prior behavior allowed repeated `app_raffles` scans for due draws across multiple service calls.

2. **Public API overfetch**
- `/api/raffles/[id]` loaded full entries list for counts.

3. **Eligible number fallback overfetch**
- Raffle pages sometimes loaded full number pool just to compute sold/winner fallback.

4. **Index opportunities**
- Existing schema has solid indexes, but high-frequency predicates benefit from extra targeted indexes.

## Changes applied
- Service-level throttling for due-draw scan (`30s` window + in-flight dedupe).
- Public API count path optimized to use already computed summary metrics.
- Eligible fallback queries narrowed to statuses `sold|winner`.
- Added migration `202603080130_performance_optimization.sql` with additive indexes:
  - `idx_app_raffles_due_draw_scan`
  - `idx_app_raffle_numbers_raffle_number`
  - `idx_app_raffle_payments_raffle_created`
  - `idx_app_raffle_entries_created_desc`

## RLS/security note
- RLS appears enabled in migrations for raffle tables.
- Server-side admin guards were strengthened on admin raffle endpoints in this pass.

## Suggested next steps
- Add query timing instrumentation (p95 per endpoint).
- Move referral leaderboard aggregation to SQL view/materialized strategy if volume grows.
- Consider paginated admin snapshot endpoints for very large raffles.
