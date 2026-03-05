# Móntate en mi viaje (PayPal Edition)

Aplicación SaaS para viajes grupales premium (website + admin + portal cliente).

## Incluye
- Website pública premium (Home, Viajes, Detalle, Reservar, Testimonios, Galería, Contacto).
- Dashboard administrativo completo V1.
- Builder de paquetes por viaje (`/admin/viajes/[slug]/builder`).
- CRM de clientes y pipeline de reservas.
- Módulo de pagos PayPal (depósito + cuotas/balance).
- Automatizaciones (reglas + ejecuciones).
- Generador de brochure PDF (`/api/pdf/trip/[slug]`).
- Portal privado cliente (mis viajes, pagos, documentos, checklist, soporte, wallet, roommate).
- Flujo completo de viajes a medida:
  - Cliente solicita paquete personalizado.
  - Admin diseña propuesta y notifica por correo.
  - Cliente acepta o pide modificaciones desde su página privada.
- Módulo de sorteos/rifas:
  - Participación solo para usuarios registrados.
  - Admin define gratis o pago por entrada.
  - Admin publica requisitos e instrucciones de pago.
  - Admin define cantidad de números disponibles y fecha/hora de anuncio.
  - Cliente selecciona número único; si se toma, queda bloqueado.
  - Countdown público al anuncio del ganador.
  - Sorteo interno tipo lotería (auto al llegar la hora o manual desde admin).
  - Cliente participa y admin confirma/rechaza entradas.
- Esquema SQL inicial para Supabase.

## Requisitos
- Node.js 20+
- npm/pnpm
- Cuenta PayPal Developer (sandbox o live)

## Variables de entorno
Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` (`sandbox` o `live`)

## Ejecutar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Endpoints clave
- `POST /api/bookings`
- `POST /api/registro`
- `GET/POST /api/raffles`
- `GET /api/raffles/:id`
- `POST /api/custom-requests`
- `PATCH /api/custom-requests/:id/response`
- `POST /api/paypal/create-order`
- `POST /api/paypal/capture-order`
- `POST /api/paypal/webhook`
- `GET /api/admin/custom-requests`
- `POST /api/admin/custom-requests/:id/proposal`
- `GET /api/admin/reports`
- `GET/PATCH /api/admin/bookings`
- `GET /api/admin/payments`
- `GET /api/admin/customers`
- `GET/POST /api/admin/raffles`
- `PATCH /api/admin/raffles/:id`
- `POST /api/admin/raffles/:id/draw`
- `PATCH /api/admin/raffles/entries/:entryId`
- `GET /api/admin/automations`
- `GET /api/pdf/trip/:slug?audience=client|internal&lang=es|en&showPrices=true|false`
- `GET /api/pdf/custom-proposal/:id`

## Notas importantes
- Esta versión V1 usa almacenamiento en memoria para reservas/pagos/CRM (`lib/booking-store.ts`).
- En producción, conectar persistencia Supabase para `bookings`, `payments`, `customers`, `documents`.
- Validar firma de webhook de PayPal antes de producción.
- Stripe está removido en esta rama; pagos solo por PayPal.
