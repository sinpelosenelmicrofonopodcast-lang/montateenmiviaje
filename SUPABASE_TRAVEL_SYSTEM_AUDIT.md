# Supabase Travel System Audit

## Fecha
- 2026-03-07

## Estado previo detectado
- `public.profiles` existía con enfoque mínimo (`id`, `email`, `role`, `phone`), sin modelado completo de viajero, onboarding ni referral global.
- `app_customers` ya era el backbone operativo para CRM/reservas/pagos.
- Existía sistema de referral avanzado para rifas (`app_raffle_referral_events`) pero no referral global del producto.
- No existía tabla dedicada para:
  - perfiles múltiples de viajeros tipo Expedia
  - preferencias de viaje estructuradas
  - progreso de onboarding persistente
  - rewards globales de referidos
- Registro y login existían, pero onboarding era inexistente y el registro pedía `fullName + phone` rígido.

## Problemas arquitectónicos
1. Falta de separación entre `profile base` y `traveler profiles`.
2. No había growth loop global (link -> signup -> conversion -> reward).
3. No había funnel de onboarding medible.
4. Datos de preferencias dispersos/no normalizados.
5. Falta de vistas analíticas para admin sobre onboarding/referidos.

## Estrategia aplicada (sin romper compatibilidad)
- Mantener `app_customers` y su flujo operativo existente.
- Expandir `public.profiles` de forma incremental (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- Crear tablas nuevas con prefijo `app_` para consistencia de naming del proyecto.
- No eliminar ni renombrar tablas existentes.
- Añadir funciones SQL + triggers + RLS orientados a ownership/admin.
- Conectar onboarding/referrals/travelers al app existente vía APIs nuevas `/api/portal/*`.

## Cambios de base de datos implementados
- Migración nueva:
  - `supabase/migrations/011_growth_profiles_referrals_onboarding.sql`
- Incluye:
  - expansión de `public.profiles`
  - tablas `app_traveler_profiles`, `app_traveler_documents`, `app_traveler_preferences`, `app_emergency_contacts`
  - tablas `app_referral_codes`, `app_referral_events`, `app_referral_rewards`
  - tablas `app_onboarding_progress`, `app_user_activity_log`, `app_saved_searches`, `app_saved_trips`
  - índices y constraints
  - funciones SQL para referral/onboarding/profile completion/activity log
  - triggers de sync/updated_at/recalc
  - RLS policies owner + admin
  - vistas admin (`app_referral_performance_v`, `app_onboarding_funnel_v`, `app_profile_completion_v`)
  - backfill seguro para usuarios existentes

## Riesgos mitigados
- No se cambió auth provider ni cookies de sesión.
- No se alteró lógica de reservas/pagos existente.
- No se eliminaron políticas o tablas críticas previas.
- Se respetó compatibilidad con flujo actual de `app_customers`.

## Pendientes opcionales
- Cifrado de documentos sensibles de viajeros (KMS/BYOK) para compliance.
- antifraude avanzado en referidos (device/IP reputation).
- dashboards con series temporales por día/semana en admin.
