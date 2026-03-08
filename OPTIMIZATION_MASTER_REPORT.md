# Optimization Master Report

## Executive summary
A full safe optimization pass was applied on the existing app without rebuilding architecture or removing active features. Focus was on high-impact, low-risk improvements across Next.js, Supabase query behavior, admin runtime stability, and route security hardening.

## What was optimized
1. **Supabase hot path**
- Throttled repeated due-draw scans and deduped concurrent runs.
- Reduced overfetch in public raffle detail endpoint.
- Narrowed raffle eligible-number fallback query scope.
- Added additive DB indexes for frequent predicates/sorts.

2. **Next.js runtime/build quality**
- Added `outputFileTracingRoot` to remove workspace-root tracing warning and stabilize output tracing behavior.
- Migrated selected image surfaces to `next/image` (`gallery`, `site header/footer`, `trip card`, `trip detail`).

3. **React stability/performance**
- Added abortable fetch logic to admin raffle snapshot refresh.
- Prevented stale response overwrite and reduced unnecessary network churn.

4. **Security hardening**
- Strengthened server-side admin checks across raffle admin APIs (defense in depth in addition to middleware).

## Files changed in this pass
- `next.config.ts`
- `lib/raffles-service.ts`
- `app/api/raffles/[id]/route.ts`
- `app/sorteos/[id]/page.tsx`
- `app/sorteos/[id]/live/page.tsx`
- `components/custom/admin-raffle-panel.tsx`
- `components/custom/gallery-experience.tsx`
- `components/site-header.tsx`
- `components/site-footer.tsx`
- `components/trip-card.tsx`
- `app/viajes/[slug]/page.tsx`
- `supabase/migrations/202603080130_performance_optimization.sql`
- plus admin raffle API guards in `app/api/admin/raffles/*`

## Measured/verified outcomes
- `pnpm run lint`: ✅ (warnings only)
- `pnpm run build`: ✅
- `<img>` occurrences reduced in touched areas; global remaining raw `<img>` count now `8`.
- Added DB index support for due-draw scans and common raffle list/order patterns.

## What was removed
- No risky feature removals.
- No destructive table/data changes.

## Memory leak risks fixed
- Admin raffle snapshot fetch race/stale response issue fixed with `AbortController` + cleanup.

## Supabase issues fixed
- Repeated due-draw scans throttled.
- One heavy entries overfetch removed from public raffle detail API.
- Added missing indexes for common query paths.

## Next.js issues fixed
- Output tracing root warning addressed in config.
- Selected image rendering migrated to `next/image`.

## Dependencies
- No removals performed (safe baseline retained).
- Online outdated audit blocked by network (`ENOTFOUND registry.npmjs.org`).

## Risk areas requiring manual follow-up
1. Very large files remain (`lib/raffles-service.ts`, `admin-raffle-panel.tsx`).
2. Remaining `<img>` usages in other files should be migrated incrementally.
3. Referral leaderboard aggregation may need SQL-level aggregation if event volume grows.
