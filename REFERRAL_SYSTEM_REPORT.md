# Referral System Report

## Objetivo
Agregar un sistema global de referidos viral (no solo de rifas) integrado al registro/onboarding/conversión.

## Qué existía
- Referidos en módulo de rifas (`app_raffle_referral_events`) sin impacto global del producto.

## Qué se implementó

### Base de datos
- `app_referral_codes`
- `app_referral_events`
- `app_referral_rewards`
- Funciones:
  - `generate_unique_referral_code`
  - `ensure_referral_code_for_user`
  - `track_referral_event`
  - `apply_referral_code_to_profile`
  - `issue_referral_reward_if_eligible`

### Tracking
- Nuevo entrypoint público de atribución:
  - `GET /ref/[code]` (set cookie + redirect a registro)
- Registro ahora acepta `referralCode`.
- Se aplica código al perfil en registro cuando corresponde.
- Conversión de booking:
  - `registerFirstBookingConversionService`
  - dispara evento `first_booking_completed`
  - intenta emitir reward elegible

### APIs portal
- `GET /api/portal/referrals` -> código + historial + rewards
- `POST /api/portal/referrals` -> aplicar código manual

### UI
- Página `/portal/referidos`
  - mostrar código, link compartible, copiar link
  - compartir por WhatsApp
  - historial de eventos y rewards

## Anti abuse implementado
- bloqueo de self-referral en SQL (`apply_referral_code_to_profile` / `track_referral_event`).
- índice único por (`referral_code_id`, `referred_user_id`, `event_type`) para evitar duplicación de eventos clave.

## Admin analytics
- Vista `app_referral_performance_v`.
- Página admin `/admin/growth` muestra top referrers y conversiones.

## Compatibilidad
- No se eliminó el sistema de referidos de rifas.
- Sistema global convive con módulo de sorteos sin ruptura.
