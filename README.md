# Móntate en mi viaje (PayPal Edition)

Aplicación SaaS para viajes grupales premium (website + admin + portal cliente).

## Incluye
- Website pública premium (Home, Viajes, Detalle, Reservar, Testimonios, Galería, Contacto).
- Dashboard público en `/dashboard`.
- Admin privado en rutas ocultas `/dashboard/admin/*`.
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
- Catálogo real en Supabase (sin mocks):
  - Viajes + builder (itinerario, paquetes, add-ons, políticas, hoteles, estado publicación).
  - Testimonios administrables.
  - Galería (álbumes + media).
  - Ofertas/códigos promocionales.
- Esquema SQL inicial para Supabase.

## Requisitos
- Node.js 20+
- npm/pnpm
- Cuenta PayPal Developer (sandbox o live)

## Variables de entorno
Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` (`sandbox` o `live`)

## Supabase (registro + sorteos)
1. Crea un proyecto en Supabase.
2. Ejecuta las migraciones SQL:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_runtime_raffles.sql`
   - `supabase/migrations/003_runtime_catalog.sql`
   - `supabase/migrations/004_runtime_operations.sql`
   - `supabase/migrations/005_profiles_admin_auth.sql`
   - `supabase/migrations/006_portal_auth_link.sql`
3. Configura en Vercel/local:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Admin Auth (rol admin)
- Las rutas `/dashboard/admin/*`, `/admin/*` (legacy) y `/api/admin/*` están protegidas por middleware.
- Login admin: `/admin/login` (Supabase Auth email + password).
- El control de acceso principal usa `public.profiles.role`.
- Si el rol no es admin, redirige a `/`.
- El enlace de Admin no se muestra en navegación pública.

Ejemplo SQL para asignar rol admin en Supabase (SQL Editor):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'tu-admin@dominio.com';
```

## Ejecutar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Portal cliente (sesión obligatoria)
- Registro de cuenta cliente: `/portal/register` (también disponible en `/registro`).
- Login portal: `/portal/login`.
- Rutas privadas del portal (`/portal`, `/portal/*`) solo accesibles con sesión activa.
- El enlace de `Portal` en navegación solo se muestra cuando el usuario está autenticado.

## Endpoints clave
- `POST /api/bookings`
- `POST /api/registro`
- `GET/POST /api/raffles`
- `GET /api/raffles/:id`
- `GET /api/health/supabase`
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
- `GET/POST /api/admin/trips`
- `PATCH /api/admin/trips/:id`
- `POST /api/admin/trips/:id/packages`
- `POST /api/admin/trips/:id/days`
- `POST /api/admin/trips/:id/addons`
- `GET/POST /api/admin/testimonials`
- `PATCH /api/admin/testimonials/:id`
- `GET/POST /api/admin/gallery/albums`
- `POST /api/admin/gallery/media`
- `GET/POST /api/admin/offers`
- `PATCH /api/admin/offers/:id`
- `GET /api/admin/automations`
- `GET /api/pdf/trip/:slug?audience=client|internal&lang=es|en&showPrices=true|false`
- `GET /api/pdf/custom-proposal/:id`

## Notas importantes
- Registro, sorteos, catálogo, reservas, pagos, CRM, solicitudes personalizadas, documentos y reportes se conectan a Supabase.
- Todo el contenido operativo se gestiona desde dashboard admin (sin mocks en runtime).
- Validar firma de webhook de PayPal antes de producción.
- Stripe está removido en esta rama; pagos solo por PayPal.
