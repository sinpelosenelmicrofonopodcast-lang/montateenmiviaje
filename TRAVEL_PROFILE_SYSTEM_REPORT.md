# Travel Profile System Report

## Objetivo
Implementar perfiles de viajeros tipo Expedia sobre la base actual, sin romper el CRM/reservas existentes.

## Qué existía
- Solo perfil base de cuenta (`public.profiles`) + cliente operativo (`app_customers`).
- No había CRUD de viajeros múltiples por usuario.

## Qué se agregó

### Modelo de datos
- `app_traveler_profiles`
- `app_traveler_documents`
- `app_traveler_preferences`
- `app_emergency_contacts`

### Backend
- Servicio nuevo: `lib/growth-service.ts`
  - `listTravelerProfilesService`
  - `createTravelerProfileService`
  - `updateTravelerProfileService`
  - `deleteTravelerProfileService`
  - `upsertTravelerPreferencesService`
- APIs portal privadas:
  - `GET/POST /api/portal/travelers`
  - `PATCH/DELETE /api/portal/travelers/[id]`
  - `GET/PATCH /api/portal/preferences`
  - `GET/PATCH /api/portal/profile`

### Frontend portal
- Página: `/portal/viajeros`
  - CRUD de viajeros, default traveler, warnings por pasaporte
- Página: `/portal/perfil`
  - perfil base + preferencias de viaje
- Componente: `components/custom/portal/portal-travelers-manager.tsx`
- Componente: `components/custom/portal/portal-profile-manager.tsx`

## Seguridad
- RLS owner por `user_id` en tablas de viajeros/preferencias/contactos.
- Política admin para gestión interna.
- API auth por sesión real (`lib/portal-api-auth.ts`) + middleware `/api/portal/*`.

## Integración con onboarding
- Crear/editar viajeros actualiza progreso automáticamente.
- Guardar preferencias actualiza progreso automáticamente.

## Compatibilidad
- `app_customers`, bookings y pagos no fueron removidos ni reemplazados.
- Flujo de reservas existente sigue operativo.
