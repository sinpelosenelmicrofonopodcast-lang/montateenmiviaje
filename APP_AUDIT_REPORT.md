# App Audit Report

## Scope
- Date: 2026-03-07
- Focus: arquitectura App Router, separación dashboard/admin, seguridad de rutas internas, consistencia UX del panel, duplicidad de navegación, performance básica.
- Constraint: cambios incrementales, sin romper features existentes.

## Key Findings

1. Admin vs Dashboard ambiguity
- Problema: coexistían `/admin` (panel real) y `/dashboard/admin` (mini panel duplicado).
- Riesgo: navegación confusa, mantenimiento duplicado, experiencia inconsistente por rol.

2. Navigation duplication
- Problema: la lista de módulos admin estaba duplicada en `app/admin/page.tsx` y `components/custom/admin-shell.tsx`.
- Riesgo: divergencias de labels/rutas y mayor costo de mantenimiento.

3. Inconsistent internal entry points
- Problema: login admin redirigía por defecto a `/dashboard/admin` en vez de ruta canónica.
- Riesgo: perpetuar rutas legacy.

4. Header internal links unclear
- Problema: header mostraba `Dashboard` y `Portal` juntos para sesión activa, sin distinción de rol.
- Riesgo: usuarios internos y clientes entrando a áreas no canónicas.

5. UX quality gaps in admin shell
- Problema: sidebar plana sin agrupación lógica + ausencia de breadcrumbs.
- Riesgo: discoverability baja, operación interna lenta.

## Secondary Findings (Not fully refactored in this pass)
- Múltiples páginas admin aún usan layouts/headers propios (heterogéneo).
- Persisten warnings de `<img>` en varias páginas no críticas.
- Falta estandarización total de tablas/filtros/formularios en todos los módulos.

## Outcome
- Se consolidó el acceso administrativo en rutas canónicas `/admin/*`.
- Se dejó compatibilidad legacy vía redirects (`/dashboard*`), sin romper enlaces existentes.
- Se centralizó navegación de admin en una sola fuente.
- Se mejoró claridad operativa del panel con agrupación y breadcrumbs.
