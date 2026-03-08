# Dependency Audit

## Installed top-level packages
Runtime:
- `next`, `react`, `react-dom`
- `@supabase/ssr`, `@supabase/supabase-js`
- `zod`
- `pdf-lib`
- `qrcode`
- `framer-motion`

Dev:
- `typescript`
- `eslint`, `eslint-config-next`
- `@types/*`

## Usage findings
- `framer-motion`: used in `components/cms/home-sections.tsx`.
- `pdf-lib`: used in PDF generation routes/services.
- `qrcode`: used in trip PDF route.
- Supabase libs: correctly split across browser/server/middleware contexts.

## Outdated check
- `pnpm outdated` could not complete in this environment (`ENOTFOUND registry.npmjs.org`), so version drift cannot be verified online in this run.

## Risk notes
- No obvious redundant heavy runtime libraries were found.
- Dependency footprint is already relatively lean for current feature scope.
