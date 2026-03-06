-- Runtime catalog data managed from admin dashboard (no mock content)

create extension if not exists "pgcrypto";

create table if not exists app_trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  destination text not null,
  category text not null check (category in ('Luxury', 'Adventure', 'Family', 'Romantic', 'Budget')),
  start_date date not null,
  end_date date not null,
  available_spots int not null check (available_spots >= 0),
  total_spots int not null check (total_spots > 0),
  hero_image text not null,
  summary text not null,
  includes text[] not null default '{}',
  excludes text[] not null default '{}',
  policies text[] not null default '{}',
  requirements text[] not null default '{}',
  hotels text[] not null default '{}',
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published', 'unpublished')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app_trips(id) on delete cascade,
  day_number int not null check (day_number > 0),
  title text not null,
  description text not null,
  map_pin text,
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table if not exists app_trip_packages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app_trips(id) on delete cascade,
  room_type text not null check (room_type in ('single', 'doble', 'triple')),
  price_per_person numeric(12,2) not null check (price_per_person > 0),
  deposit numeric(12,2) not null check (deposit > 0),
  payment_plan text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, room_type)
);

create table if not exists app_trip_addons (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app_trips(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app_testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  trip_title text not null,
  quote text not null,
  rating int not null check (rating between 1 and 5),
  verified boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app_gallery_albums (
  id uuid primary key default gen_random_uuid(),
  trip_slug text not null,
  title text not null,
  cover_image text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app_gallery_media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references app_gallery_albums(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  url text not null,
  caption text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  value numeric(12,2) not null check (value > 0),
  trip_slug text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app_automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_event text not null,
  channel text not null check (channel in ('email', 'whatsapp')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app_checklist_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_trips_publish_featured on app_trips(publish_status, featured, start_date);
create index if not exists idx_app_offers_active_dates on app_offers(active, starts_at, ends_at);

alter table app_trips enable row level security;
alter table app_trip_days enable row level security;
alter table app_trip_packages enable row level security;
alter table app_trip_addons enable row level security;
alter table app_testimonials enable row level security;
alter table app_gallery_albums enable row level security;
alter table app_gallery_media enable row level security;
alter table app_offers enable row level security;
alter table app_automation_rules enable row level security;
alter table app_checklist_items enable row level security;
