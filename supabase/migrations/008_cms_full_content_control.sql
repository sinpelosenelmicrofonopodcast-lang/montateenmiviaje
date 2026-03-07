-- CMS + full public content control from admin dashboard

create extension if not exists "pgcrypto";

-- -----------------------------
-- Existing modules enrichment
-- -----------------------------

alter table if exists app_trips
  add column if not exists short_description text,
  add column if not exists long_description text,
  add column if not exists duration_days int,
  add column if not exists gallery_images text[] not null default '{}',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_og_image text;

alter table if exists app_trips
  drop constraint if exists app_trips_publish_status_check;

alter table if exists app_trips
  add constraint app_trips_publish_status_check
  check (publish_status in ('draft', 'published', 'unpublished', 'sold_out', 'archived'));

alter table if exists app_offers
  add column if not exists subtitle text,
  add column if not exists image_url text,
  add column if not exists cta_label text,
  add column if not exists cta_href text,
  add column if not exists publish_status text not null default 'published',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_og_image text;

alter table if exists app_offers
  drop constraint if exists app_offers_publish_status_check;

alter table if exists app_offers
  add constraint app_offers_publish_status_check
  check (publish_status in ('draft', 'published', 'archived'));

alter table if exists app_raffles
  add column if not exists rules_text text,
  add column if not exists image_url text,
  add column if not exists cta_label text,
  add column if not exists cta_href text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_og_image text;

update app_raffles
set rules_text = coalesce(rules_text, requirements)
where rules_text is null;

alter table if exists app_testimonials
  add column if not exists city text,
  add column if not exists photo_url text,
  add column if not exists video_url text,
  add column if not exists featured boolean not null default false,
  add column if not exists publish_status text not null default 'published';

alter table if exists app_testimonials
  drop constraint if exists app_testimonials_publish_status_check;

alter table if exists app_testimonials
  add constraint app_testimonials_publish_status_check
  check (publish_status in ('draft', 'published', 'archived'));

alter table if exists app_gallery_albums
  add column if not exists publish_status text not null default 'published';

alter table if exists app_gallery_albums
  drop constraint if exists app_gallery_albums_publish_status_check;

alter table if exists app_gallery_albums
  add constraint app_gallery_albums_publish_status_check
  check (publish_status in ('draft', 'published', 'archived'));

alter table if exists app_gallery_media
  add column if not exists alt_text text,
  add column if not exists featured boolean not null default false;

create index if not exists idx_app_trips_publish_featured_start
  on app_trips(publish_status, featured, start_date);

create index if not exists idx_app_offers_publish_active_dates
  on app_offers(publish_status, active, starts_at, ends_at);

create index if not exists idx_app_testimonials_publish_featured
  on app_testimonials(publish_status, featured, created_at desc);

-- -----------------------------
-- CMS Core
-- -----------------------------

create table if not exists app_site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  label text not null,
  slug text not null,
  hero_badge text,
  hero_title text,
  hero_subtitle text,
  hero_image text,
  status text not null default 'published' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  seo_og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references app_site_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  badge text,
  image_url text,
  cta_label text,
  cta_href text,
  content_json jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_key)
);

create table if not exists app_site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_group text not null default 'general',
  setting_key text not null unique,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists app_media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  mime_type text,
  width int,
  height int,
  size_bytes bigint,
  alt_text text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_site_pages_key_status
  on app_site_pages(page_key, status);

create index if not exists idx_app_page_sections_page_order
  on app_page_sections(page_id, sort_order, is_active);

create index if not exists idx_app_site_settings_group_key
  on app_site_settings(setting_group, setting_key);

create index if not exists idx_app_media_assets_featured
  on app_media_assets(is_featured, created_at desc);

alter table app_site_pages enable row level security;
alter table app_page_sections enable row level security;
alter table app_site_settings enable row level security;
alter table app_media_assets enable row level security;

-- -----------------------------
-- Seed pages
-- -----------------------------

insert into app_site_pages (page_key, label, slug, hero_badge, hero_title, hero_subtitle, status, seo_title, seo_description)
values
  ('home', 'Home', '/', 'Premium Group Travel', 'Viajes grupales premium con estética editorial y concierge.', 'Diseñamos experiencias internacionales para grupos que quieren viajar con estilo, orden y soporte real.', 'published', 'Móntate en mi viaje | Viajes grupales premium', 'Viajes grupales premium, reservas con PayPal y experiencias internacionales curadas.'),
  ('viajes', 'Viajes', '/viajes', 'Colección', 'Viajes grupales internacionales', 'Filtra destinos, fechas y categorías para reservar tu próxima experiencia.', 'published', 'Viajes grupales premium', 'Explora viajes por destino, categoría y fechas con información detallada.'),
  ('ofertas', 'Ofertas', '/ofertas', 'Promociones activas', 'Ofertas y promociones', 'Promos vigentes administradas desde el panel interno.', 'published', 'Ofertas de viaje', 'Descuentos y promociones activas para viajes grupales premium.'),
  ('sorteos', 'Sorteos', '/sorteos', 'Sorteos y rifas', 'Participa en premios y viajes', 'Selecciona número, cumple requisitos y sigue el countdown del ganador.', 'published', 'Sorteos y rifas', 'Sorteos activos con selección de números y anuncio de ganadores.'),
  ('testimonios', 'Testimonios', '/testimonios', 'Clientes reales', 'Testimonios verificados', 'Historias, resultados y experiencias de viajeros.', 'published', 'Testimonios de viajeros', 'Opiniones verificadas de clientes que viajaron con nosotros.'),
  ('galeria', 'Galería', '/galeria', 'Travel Highlights', 'Galería premium', 'Fotos y videos de experiencias internacionales.', 'published', 'Galería de viajes', 'Álbumes y media de viajes grupales premium.'),
  ('about', 'About', '/about', 'Nuestra marca', 'Sobre Móntate en mi viaje', 'Historia, misión y visión de la marca.', 'published', 'Sobre nosotros', 'Conoce la historia y visión de Móntate en mi viaje.'),
  ('contacto', 'Contacto', '/contacto', 'Hablemos', 'Contacto', 'Canales directos para planificar tu próximo viaje.', 'published', 'Contacto', 'Email, WhatsApp y redes para conectar con el equipo.'),
  ('faq', 'FAQ', '/faq', 'Preguntas frecuentes', 'Todo lo que debes saber', 'Respuestas rápidas sobre reservas, pagos y operación.', 'published', 'FAQ', 'Preguntas frecuentes sobre viajes, pagos y políticas.')
on conflict (page_key) do update
set
  label = excluded.label,
  slug = excluded.slug,
  hero_badge = excluded.hero_badge,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

-- -----------------------------
-- Seed home sections
-- -----------------------------

with home_page as (
  select id from app_site_pages where page_key = 'home' limit 1
)
insert into app_page_sections (
  page_id,
  section_key,
  section_type,
  title,
  subtitle,
  badge,
  cta_label,
  cta_href,
  content_json,
  sort_order,
  is_active,
  status
)
select
  home_page.id,
  seeded.section_key,
  seeded.section_type,
  seeded.title,
  seeded.subtitle,
  seeded.badge,
  seeded.cta_label,
  seeded.cta_href,
  seeded.content_json,
  seeded.sort_order,
  seeded.is_active,
  seeded.status
from home_page,
lateral (
  values
    (
      'hero_main',
      'hero',
      'Viajes grupales premium que se venden solos',
      'Landing editorial enfocada en conversión: catálogo, ofertas, sorteos y atención concierge en una sola experiencia.',
      'Premium Concierge',
      'Explorar viajes',
      '/viajes',
      '{"secondaryCtaLabel":"Solicitar viaje a medida","secondaryCtaHref":"/solicitar-viaje","statCards":[{"label":"Experiencias operadas","value":"+42"},{"label":"Clientes recomiendan","value":"95%"},{"label":"Respuesta concierge","value":"24h"}]}'::jsonb,
      10,
      true,
      'published'
    ),
    (
      'benefits',
      'benefits',
      '¿Por qué viajar con nosotros?',
      'Operación premium, pagos claros y documentación profesional.',
      null,
      null,
      null,
      '{"items":[{"title":"Curaduría premium","description":"Itinerarios diseñados para grupos con estándar editorial y concierge."},{"title":"Pago flexible","description":"Depósito + plan de pago con seguimiento automático."},{"title":"Todo centralizado","description":"Reservas, PDFs, documentos y soporte en un solo portal."}]}'::jsonb,
      20,
      true,
      'published'
    ),
    (
      'how_it_works',
      'how_it_works',
      'Cómo funciona',
      'Proceso simple para reservar y viajar sin fricción.',
      null,
      null,
      null,
      '{"steps":[{"title":"Explora o solicita","description":"Elige un viaje publicado o pide un paquete a medida."},{"title":"Reserva y paga","description":"Separa con depósito y administra tu plan de pago."},{"title":"Recibe todo listo","description":"Accede a PDF premium, checklist y soporte antes de viajar."}]}'::jsonb,
      30,
      true,
      'published'
    ),
    (
      'featured_trips',
      'featured_trips',
      'Viajes destacados',
      'Cupos limitados y experiencias internacionales activas.',
      null,
      'Ver todos los viajes',
      '/viajes',
      '{"limit":6}'::jsonb,
      40,
      true,
      'published'
    ),
    (
      'offers_banner',
      'offers_banner',
      'Ofertas activas',
      'Promociones y códigos administrados por el equipo.',
      null,
      'Ver ofertas',
      '/ofertas',
      '{"highlight":"Promociones con vigencia limitada para aumentar conversión."}'::jsonb,
      50,
      true,
      'published'
    ),
    (
      'social_proof',
      'testimonials',
      'Testimonios verificados',
      'Contenido social proof para reforzar confianza.',
      null,
      'Ver todos los testimonios',
      '/testimonios',
      '{"limit":6}'::jsonb,
      60,
      true,
      'published'
    ),
    (
      'home_faq',
      'faq',
      'Preguntas frecuentes',
      'Respuestas rápidas antes de reservar.',
      null,
      null,
      null,
      '{"items":[{"q":"¿Cómo reservo?","a":"Selecciona un viaje, completa tus datos y paga depósito con PayPal."},{"q":"¿Puedo pagar en cuotas?","a":"Sí, cada paquete puede incluir plan de pago configurable."},{"q":"¿Recibo brochure?","a":"Sí, generamos PDF premium automático por viaje."}]}'::jsonb,
      70,
      true,
      'published'
    ),
    (
      'final_cta',
      'final_cta',
      '¿Listo para tu próximo viaje?',
      'Habla con el equipo y te ayudamos a cerrar tu experiencia hoy.',
      null,
      'Solicitar viaje',
      '/solicitar-viaje',
      '{"secondaryCtaLabel":"Ver sorteos","secondaryCtaHref":"/sorteos"}'::jsonb,
      80,
      true,
      'published'
    )
) as seeded(
  section_key,
  section_type,
  title,
  subtitle,
  badge,
  cta_label,
  cta_href,
  content_json,
  sort_order,
  is_active,
  status
)
on conflict (page_id, section_key) do update
set
  section_type = excluded.section_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  badge = excluded.badge,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  content_json = excluded.content_json,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- Generic header sections for non-home pages
with seeded_pages as (
  select id, page_key from app_site_pages where page_key in ('viajes','ofertas','sorteos','testimonios','galeria','about','contacto','faq')
)
insert into app_page_sections (page_id, section_key, section_type, title, subtitle, sort_order, is_active, status)
select
  sp.id,
  'page_intro',
  'page_intro',
  case sp.page_key
    when 'about' then 'Conoce nuestra historia, misión y visión'
    when 'contacto' then 'Canales directos para ayudarte a reservar'
    when 'faq' then 'Resolvemos tus dudas más comunes'
    else 'Contenido administrado desde CMS'
  end,
  case sp.page_key
    when 'about' then 'Marca premium especializada en viajes grupales internacionales.'
    when 'contacto' then 'Email, WhatsApp y redes actualizables por el equipo admin.'
    when 'faq' then 'Actualiza preguntas y respuestas sin tocar código.'
    else 'Título, subtítulo, SEO y bloques editables desde admin.'
  end,
  10,
  true,
  'published'
from seeded_pages sp
on conflict (page_id, section_key) do nothing;

-- Settings seed
insert into app_site_settings (setting_group, setting_key, value_json)
values
  ('branding', 'site_identity', '{"siteName":"Móntate en mi viaje","tagline":"Premium group travel","logoUrl":"/logo-header.png","faviconUrl":"/favicon.png"}'::jsonb),
  ('contact', 'contact_info', '{"email":"hello@montateenmiviaje.com","phone":"+1 (555) 010-2026","whatsapp":"+1 (555) 010-2026","address":"Miami, FL","hours":"Lun-Vie 9:00-18:00"}'::jsonb),
  ('social', 'social_links', '{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com"}'::jsonb),
  ('analytics', 'tracking', '{"googleAnalyticsId":"","metaPixelId":"","customHeadScript":""}'::jsonb)
on conflict (setting_key) do update
set value_json = excluded.value_json, updated_at = now();
