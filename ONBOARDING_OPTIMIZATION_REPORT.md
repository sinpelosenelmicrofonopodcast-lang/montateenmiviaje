# Onboarding Optimization Report

## Objetivo
Reducir fricción de alta y acelerar activación inicial con onboarding por pasos persistente.

## Cambios en registro
- Formulario actualizado:
  - antes: `fullName + phone obligatorio`
  - ahora: `first_name`, `last_name`, `email`, `password`, `country`, `phone opcional`, `referral opcional`
- Archivos:
  - `components/custom/register-user-form.tsx`
  - `app/portal/register/page.tsx`
  - `app/registro/page.tsx`
  - `app/api/registro/route.ts`

## Flujo onboarding implementado
- Nueva página: `/portal/onboarding`
- Componente: `components/custom/portal/portal-onboarding-flow.tsx`
- Pasos implementados:
  1. Perfil básico
  2. Preferencias de viaje
  3. Primer viajero
  4. Referido + activación

## Persistencia y reanudación
- Tabla: `app_onboarding_progress`.
- Funciones SQL:
  - `recalc_onboarding_progress`
  - `mark_onboarding_step`
- API:
  - `GET/PATCH /api/portal/onboarding`

## Redirección inteligente
- Login portal ahora dirige a `/portal/onboarding` por defecto.
- `/portal` redirige a onboarding si está incompleto.
- `/portal/onboarding` redirige a `/portal` cuando está completado.

## Tracking de activación
- eventos de actividad se registran vía `log_user_activity`.
- integración de paso `first_quote_requested` en `POST /api/custom-requests`.
- integración de conversión por booking en `POST /api/bookings`.

## Admin visibility
- Nueva página `/admin/growth` con:
  - funnel de onboarding
  - top referrers
  - perfiles incompletos

## Riesgos evitados
- No se tocó Supabase Auth flow base.
- No se rompieron rutas legacy de portal/admin.
- No se removieron módulos existentes de negocio.

## Pendientes opcionales
- experimentos A/B de copy por paso.
- score de fricción por campo para optimizar abandono.
- nudges por email/WhatsApp para completar onboarding.
