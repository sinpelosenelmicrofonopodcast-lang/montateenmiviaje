# Notifications System Report

## 1) Audit Findings (existing project)
- Framework: Next.js App Router (`app/`), TypeScript.
- Auth/session: Supabase (`@supabase/ssr`) with server helpers (`lib/portal-auth.ts`, `lib/admin-guard.ts`, `middleware.ts`).
- Business modules found:
  - Raffles: `lib/raffles-service.ts`
  - Trips/catalog: `lib/catalog-service.ts`
  - Bookings/payments/runtime: `lib/runtime-service.ts`
- Existing email integration already present: `lib/email.ts` + `app_email_logs`.
- Existing OneSignal partial integration existed: `components/custom/onesignal-init.tsx` (SDK init only, no user identity sync).
- Internal inbox notifications module did not exist as first-class feature.

## 2) Implemented Architecture

Event-driven multichannel pipeline:

`BUSINESS EVENT -> ORCHESTRATOR -> CHANNELS (push/email/inbox) -> per-channel delivery logs`

Core files:
- `lib/notifications/orchestrator.ts`
- `lib/notifications/templates.ts`
- `lib/notifications/channels/push-channel.ts`
- `lib/notifications/channels/email-channel.ts`
- `lib/notifications/service.ts`
- `lib/notifications/types.ts`
- `lib/notifications/api-auth.ts`

## 3) Database Migration

Added migration:
- `supabase/migrations/202603081955_notification_orchestrator.sql`

Adds:
- `app_notification_events`
- `app_notifications`
- `app_notification_deliveries`
- `app_user_notification_preferences`
- indexes, triggers (`updated_at`), and RLS policies
- helper function `is_notification_admin_role()`
- view `app_notification_delivery_summary_v`

## 4) API Endpoints Added

Portal:
- `GET/PATCH /api/portal/notifications`
- `PATCH /api/portal/notifications/[id]`
- `GET/PATCH /api/portal/notification-preferences`

Admin:
- `GET/POST /api/admin/notifications`
- `POST /api/admin/notifications/deliveries/[id]/retry`

## 5) UI Added

Portal:
- `app/portal/notificaciones/page.tsx`
- `components/custom/portal/portal-notifications-manager.tsx`
- Added module card in `app/portal/page.tsx`

Admin:
- `app/admin/notificaciones/page.tsx`
- `components/custom/admin-notifications-manager.tsx`
- Added nav item in `lib/admin-navigation.ts`

Header:
- `components/site-header.tsx` now shows `Alertas` link with unread count for logged-in non-admin users.

## 6) OneSignal Integration Improvements

Updated:
- `components/custom/onesignal-init.tsx`
  - env-based app id support
  - service worker paths explicitly set
  - non-aggressive permission flow (no forced popup on load)
- Added `components/custom/onesignal-user-sync.tsx`
  - links OneSignal user identity to Supabase user id (`external_id` flow via `login()` / fallback)
  - handles logout sync
- Included in root layout:
  - `app/layout.tsx` now mounts both init + user sync.

Reason prompt wasn’t appearing:
- browser permission is user-gesture driven and now is requested from explicit button in portal notifications center.

## 7) Business Events Connected

### Raffles (`lib/raffles-service.ts`)
- `RAFFLE_PUBLISHED` when:
  - raffle is created already published
  - status transitions to published
  - update transitions draft/unpublished -> published
- `RAFFLE_ENTRY_CONFIRMED` when:
  - entry auto-confirmed (free flow)
  - admin status update changes entry to confirmed
- `PAYMENT_CONFIRMED` / `PAYMENT_FAILED` on manual raffle payment review updates.

### Trips (`lib/catalog-service.ts`)
- `TRIP_PUBLISHED` on create/update when trip is published.
- `TRIP_BOOKING_UPDATED` on meaningful published-trip changes (dates/destination/cupos/resumen/portada), targeted to bookings of that trip slug.

### Bookings/Payments (`lib/runtime-service.ts`, `app/api/paypal/capture-order/route.ts`)
- `TRIP_BOOKING_UPDATED` when booking stage changes.
- `PAYMENT_CONFIRMED` after successful PayPal capture reconciliation.
- `PAYMENT_FAILED` when capture response is not completed.

## 8) Idempotency / Duplicate Control

Implemented with `dedupe_key` on event creation (`app_notification_events`) and unique index:
- repeated webhooks/retries with same dedupe key do not create duplicate master events.

## 9) Preferences

Per-user channel preferences added and wired:
- push/email global
- marketing vs transactional
- raffle/trip/payment granularity

## 10) Environment Variables

Updated `.env.example` with:
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `APP_BASE_URL`

Existing email vars reused:
- `RESEND_API_KEY`
- `EMAIL_FROM`

## 11) Local Testing Checklist

1. Run migration in Supabase SQL editor.
2. Set env vars (`NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`).
3. `pnpm run dev`.
4. Login as user -> open `/portal/notificaciones`:
   - list loads
   - mark read / mark all read works
   - preference toggles persist
   - “Activar notificaciones push” triggers browser permission flow
5. Login as admin -> `/admin/notificaciones`:
   - metrics/events/deliveries load
   - manual broadcast works
   - failed delivery retry works
6. Publish a raffle/trip and verify event + delivery rows are created.
7. Confirm raffle entry / payment and verify push/email/inbox generation.

## 12) Build/Lint Status
- `pnpm run build`: ✅ success
- `pnpm run lint`: ✅ pass with pre-existing image optimization warnings (no blocking errors).

