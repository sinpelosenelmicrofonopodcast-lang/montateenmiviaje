# Raffles Verification Upgrade Report

## 1) Auditoría rápida del sistema existente
- El sistema ya tenía base `commit_reveal` en `app_raffles` + `draw_payload_json`.
- El draw era server-side en `lib/raffles-service.ts` y no se calculaba en frontend.
- Existía auditoría (`app_raffle_admin_logs`) y panel admin funcional.
- Problemas detectados:
  - Copy técnico poco entendible para usuario normal.
  - Falta de estados de verificación más claros para operación.
  - API pública podía exponer `drawPayloadJson` completo (riesgo de revelar secretos si se guardaban ahí).
  - Flujo admin no separaba claramente `preparar / cerrar ventas / sortear / publicar`.
  - No existía acta exportable pública.

## 2) Cambios implementados (sin romper rutas ni lógica core)

### Backend / seguridad / verificación
- Se endureció la lógica de `sha256-modulo-v1` en servidor:
  - `commit_hash = SHA256(draw_secret)`
  - `draw_hash = SHA256(draw_secret:raffle_id:close_timestamp:total_tickets)`
  - `winning_index = bigint(draw_hash_hex) % total_tickets`
  - `winning_number` mapeado sobre números elegibles ordenados ascendente.
- Se mantuvo compatibilidad con rifas legacy y payload previo.
- Se ocultó la clave (`draw_secret`) hasta que el draw esté ejecutado.
- Se sanitizaron endpoints públicos para no devolver `drawPayloadJson` crudo.
- Se agregó resultado de verificación estructurado (`RaffleVerificationResult`) con checks:
  - `commit`
  - `drawHash`
  - `winner`
  - `payloadComplete`

### Nuevas operaciones admin (integradas al sistema actual)
- `prepareVerifiedRaffleService`
- `closeRaffleSalesService`
- `publishRaffleWinnerService`
- `exportRaffleCertificateService`

### Nuevos endpoints admin
- `POST /api/admin/raffles/[id]/prepare`
- `POST /api/admin/raffles/[id]/close-sales`
- `POST /api/admin/raffles/[id]/publish`
- `GET /api/admin/raffles/[id]/certificate`

### Nuevos endpoints públicos
- `GET /api/raffles/[id]/certificate`

### UI pública premium de verificación
- Nuevo componente: `RaffleVerificationPanel`
  - Estado visual entendible (verificado / pendiente / legacy / fallo).
  - Datos verificables con botón copiar.
  - Verificación automática con checklist visible.
  - Explicación humana + bloque técnico resumido.
  - Enlace al acta del sorteo.
- Integrado en `app/sorteos/[id]/page.tsx`.

### UI admin (live tab) mejorada
- Flujo operativo claro:
  - Preparar sorteo
  - Cerrar ventas
  - Iniciar draw
  - Publicar ganador
  - Verificar integridad
  - Exportar acta
- Etiqueta de ciclo de vida más clara por rifa.

### Certificado/acta
- Página: `/sorteos/[id]/acta`
- Export JSON público: `/api/raffles/[id]/certificate`

## 3) Migración creada
- `supabase/migrations/013_raffle_verification_hardening.sql`
  - Nuevas columnas de verificación y trazabilidad.
  - Check constraint para `verification_status`.
  - Backfill desde `draw_payload_json`.
  - Índices para consultas operativas.
  - View `raffle_audit_logs` sobre logs existentes.

## 4) Compatibilidad legacy
- Si faltan columnas nuevas, el servicio hace fallback sin romper (reintentos sin campos nuevos).
- Si la rifa no tiene datos suficientes, la UI muestra estados `pendiente` o `legacy`.
- No se destruyeron rifas ni números existentes.

## 5) Notas de seguridad
- Ganador sigue calculándose exclusivamente en servidor.
- Middleware actual sigue protegiendo `/api/admin/*`.
- Se redujo exposición de secretos en APIs públicas.
- Se reforzó idempotencia de draw (no re-sortear cuando ya hay `drawn_at`).
- Se protegieron explícitamente las rutas `api/admin/raffles/*` con validación server-side de admin antes de ejecutar acciones sensibles.
- Se corrigió el estado visual de la tómbola para no mostrar ganador mientras el sorteo siga pendiente.

## 6) Pendientes opcionales recomendados (fase 2)
- Añadir firma digital del acta (hash del documento).
- Agregar “replay visual” de draw usando payload persistido.
- Endpoint público “step-by-step proof” para auditores externos.
- Política RLS adicional para segmentar lectura pública de campos de verificación.
