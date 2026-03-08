# Supabase Query Optimization Report

## Goals
- Reduce repeated DB scans
- Reduce overfetch
- Improve hot-path index support
- Preserve existing behavior

## Optimizations implemented

### 1) Due draw scanner throttling + in-flight dedupe
- File: `lib/raffles-service.ts`
- Change:
  - `runDueRaffleDrawsSupabase` now throttled (30s window)
  - Added in-flight promise dedupe to prevent parallel duplicate scans
- Benefit:
  - Prevents repeated `app_raffles` scans during clustered requests.

### 2) Removed heavy entry overfetch from public raffle detail API
- File: `app/api/raffles/[id]/route.ts`
- Change:
  - Removed full `listRaffleEntriesService(id)` call for counts.
  - Reused `summary.metrics.confirmedEntries` instead.
- Benefit:
  - Smaller server workload and payload.

### 3) Narrowed eligible-number fallback query scope
- Files:
  - `app/sorteos/[id]/page.tsx`
  - `app/sorteos/[id]/live/page.tsx`
- Change:
  - Query only statuses `sold` and `winner` instead of full pool fallback.
- Benefit:
  - Less query/data processing overhead, especially on larger pools.

### 4) Added DB performance indexes
- Migration: `supabase/migrations/202603080130_performance_optimization.sql`
- Added indexes:
  - `idx_app_raffles_due_draw_scan`
  - `idx_app_raffle_numbers_raffle_number`
  - `idx_app_raffle_payments_raffle_created`
  - `idx_app_raffle_entries_created_desc`

## Compatibility
- All changes are additive and backward-safe.
- No destructive schema changes.
