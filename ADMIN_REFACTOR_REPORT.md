# Admin Refactor Report

## Objective
Simplificar y profesionalizar la arquitectura interna, eliminando confusión entre `dashboard` y `admin`, sin romper compatibilidad.

## Architecture Decision

### Canonical internal areas
- Admin interno: `/admin/*`
- Portal cliente: `/portal/*`
- Dashboard legacy: `/dashboard*` (compatibilidad, redirige)

### Legacy mapping
- `/dashboard` -> `/admin` (si admin) o `/portal` (si usuario autenticado), `/portal/login` (si no autenticado)
- `/dashboard/admin` -> `/admin`
- `/dashboard/admin/users` -> `/admin/users`
- `/dashboard/admin/settings` -> `/admin/configuracion`

## Implemented Changes

1. Centralized admin navigation
- Added: `lib/admin-navigation.ts`
- Uso:
  - `components/custom/admin-shell.tsx`
  - `app/admin/page.tsx`
- Beneficio: fuente única para labels, rutas y helpers.

2. Admin shell UX upgrade
- `components/custom/admin-shell.tsx`:
  - sidebar agrupada por dominios
  - breadcrumbs contextuales
  - quick links “Ver sitio / Ver portal”

3. New canonical routes
- Added:
  - `app/admin/users/page.tsx`
  - `app/admin/settings/page.tsx` (alias redirect a configuración)

4. Legacy route cleanup (compatibility preserved)
- Replaced with redirect pages/layout:
  - `app/dashboard/page.tsx`
  - `app/dashboard/admin/layout.tsx`
  - `app/dashboard/admin/page.tsx`
  - `app/dashboard/admin/users/page.tsx`
  - `app/dashboard/admin/settings/page.tsx`

5. Admin login redirect fix
- `components/custom/admin-login-form.tsx`
- Default post-login route:
  - before: `/dashboard/admin`
  - now: `/admin`

6. Header role-aware simplification
- `components/site-header.tsx`
- Ahora distingue:
  - admin -> muestra `Admin`
  - usuario cliente -> muestra `Portal`
  - mantiene `Mi panel` como alias controlado (`/dashboard`) para backward compatibility

7. Styling support for grouped admin nav
- `app/globals.css`
- Nuevas clases:
  - `.admin-sidebar-group`
  - `.admin-sidebar-group-title`

## Breaking Changes
- Ningún breaking change funcional.
- Las rutas legacy siguen funcionando por redirect.

## Risk Notes
- Algunos módulos admin aún tienen layouts internos heterogéneos (no bloqueante).
- Recomendado: normalizar headers/secciones en próxima iteración.
