# Codebase Performance Audit

## Scope
- Project: `/Users/gabriel/Montate en mi viaje`
- Stack: Next.js App Router + Supabase + React 19 + TypeScript
- Files scanned: 290
- `app/components/lib` TS/TSX lines: 31,100
- Client components (`"use client"`): 48

## High-impact findings
1. **Large monolithic service and admin files**
- `lib/raffles-service.ts` (~2,981 LOC) is the main hotspot for maintainability and query orchestration risk.
- `components/custom/admin-raffle-panel.tsx` (~1,765 LOC) has high render + state complexity.

2. **Repeated heavy backend checks on hot paths**
- `runDueRaffleDrawsSupabase()` was being invoked from multiple listing functions and could run repeated due-draw scans in tight sequences.

3. **Overfetch in public raffle detail API**
- `/api/raffles/[id]` fetched all entries to compute counts, causing unnecessary payload and DB load.

4. **Image rendering warnings and LCP risk**
- Multiple pages/components still render raw `<img>`.
- This produces lint warnings and potential LCP/perf regressions on media-heavy pages.

5. **Admin API access checks inconsistent before this pass**
- Some `api/admin/raffles/*` endpoints relied mainly on middleware. Server-side route guard consistency is critical for defense in depth.

6. **Potential client-side race condition in admin snapshot fetch**
- `AdminRafflePanel` snapshot refresh could race when switching raffle quickly, causing stale state writes.

## Dead code / duplication audit
- No obvious orphan modules were removed in this pass.
- No broad deletions were applied to avoid breaking behavior without graph-level proof.
- Recommendation: run graph-based analyzer (`ts-prune` / dependency-cruiser) in CI with internet-enabled env.

## Improvements applied in this pass
- Added throttled due-draw scanner in `lib/raffles-service.ts`.
- Removed one heavy overfetch from `app/api/raffles/[id]/route.ts`.
- Reduced raffle-page eligible-number fallback query scope to sold/winner only.
- Added abort-safe snapshot fetch flow in `admin-raffle-panel`.
- Migrated key image surfaces to `next/image` where safe.
- Added explicit server-side admin guard calls in raffle admin API routes.

## Remaining opportunities
- Split `lib/raffles-service.ts` into `queries/commands/verification` modules.
- Split `admin-raffle-panel` by tabs into lazy-loaded components.
- Continue replacing remaining `<img>` usage where compatible.
- Add telemetry around API latency and hot query frequency.
