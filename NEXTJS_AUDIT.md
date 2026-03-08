# Next.js Audit

## Current state
- Framework: Next.js `15.5.9`
- Router: App Router
- Build status: ✅ passes (`pnpm run build`)
- Lint status: ✅ passes with warnings

## Findings
1. **Output tracing root warning (resolved)**
- Previous builds warned about root lockfile detection.
- Fixed by setting `outputFileTracingRoot` in `next.config.ts`.

2. **Client/server boundary mostly good, but some large client surfaces remain**
- 48 client components.
- Largest client hotspot: `components/custom/admin-raffle-panel.tsx`.

3. **Image optimization gaps**
- Lint still reports `@next/next/no-img-element` in remaining files.
- Some migrated in this pass (`site-header`, `site-footer`, `trip-card`, `trip detail`, gallery experience).

4. **Dynamic routes heavy but intentional**
- Several admin and raffle routes use dynamic rendering; acceptable due role/auth/data freshness.

## Changes applied
- `next.config.ts`
  - Added `outputFileTracingRoot: process.cwd()`.
- Reduced DB-driven work on raffle pages (indirectly reducing TTFB pressure).
- Converted selected `<img>` to `next/image` in high-traffic/public surfaces.

## Suggested next steps
- Migrate remaining `<img>` usages incrementally.
- Split large client components by route/tab with `dynamic()` where appropriate.
- Add targeted Suspense boundaries for heavy admin sections.
