# Móntate en mi viaje - Architecture (PayPal)

## Surfaces
- Public website (`/` + marketing pages + booking).
- Admin dashboard (`/admin/*`).
- Client portal (`/portal/*`).

## Payments
- PayPal only in current phase.
- Flow:
  1. Create booking in `/api/bookings`.
  2. Create PayPal order in `/api/paypal/create-order`.
  3. Capture order in `/api/paypal/capture-order`.
  4. Reconcile async notifications in `/api/paypal/webhook`.

## Core modules
- Trips and package builder.
- CRM and booking pipeline.
- Payments and installment tracking.
- Automations (email/WhatsApp/push).
- PDF brochure generation (next phase worker).

## Security
- Supabase Auth + RLS.
- Private/public storage buckets.
- Webhook signature validation (pending implementation).
- Audit logs for critical changes.
