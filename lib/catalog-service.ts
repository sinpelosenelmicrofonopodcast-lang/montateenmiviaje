import {
  AutomationRule,
  GalleryAlbum,
  GalleryMedia,
  Offer,
  RoomType,
  Testimonial,
  Trip,
  TripCategory
} from "@/lib/types";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

interface AppTripRow {
  id: string;
  slug: string;
  title: string;
  destination: string;
  category: TripCategory;
  start_date: string;
  end_date: string;
  available_spots: number;
  total_spots: number;
  hero_image: string;
  summary: string;
  price_from?: number | string | null;
  short_description: string | null;
  long_description: string | null;
  duration_days: number | null;
  gallery_images: string[] | null;
  includes: string[] | null;
  excludes: string[] | null;
  policies: string[] | null;
  requirements: string[] | null;
  hotels: string[] | null;
  publish_status: "draft" | "published" | "unpublished" | "sold_out" | "archived";
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
}

interface AppTripDayRow {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  description: string;
  map_pin: string | null;
}

interface AppTripPackageRow {
  id: string;
  trip_id: string;
  room_type: RoomType;
  price_per_person: number;
  deposit: number;
  payment_plan: string;
}

interface AppTripAddonRow {
  id: string;
  trip_id: string;
  name: string;
  price: number;
  active: boolean;
}

interface AppTestimonialRow {
  id: string;
  customer_name: string;
  trip_title: string;
  quote: string;
  rating: number;
  verified: boolean;
  approved: boolean;
  city: string | null;
  photo_url: string | null;
  video_url: string | null;
  featured: boolean;
  publish_status: "draft" | "published" | "archived";
}

interface AppGalleryAlbumRow {
  id: string;
  trip_slug: string;
  title: string;
  cover_image: string;
  featured: boolean;
}

interface AppGalleryMediaRow {
  id: string;
  album_id: string;
  media_type: "photo" | "video";
  url: string;
  caption: string;
  sort_order: number;
}

interface AppOfferRow {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  code: string;
  discount_type: "fixed" | "percent";
  value: number;
  trip_slug: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  publish_status: "draft" | "published" | "archived";
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
}

interface AppAutomationRuleRow {
  id: string;
  name: string;
  trigger_event: string;
  channel: "email" | "whatsapp";
  active: boolean;
}

interface AppChecklistItemRow {
  id: string;
  label: string;
  sort_order: number;
  active: boolean;
}

export interface GalleryAlbumBundle {
  album: GalleryAlbum;
  media: GalleryMedia[];
}

export interface CreateTripInput {
  slug: string;
  title: string;
  destination: string;
  category: TripCategory;
  startDate: string;
  endDate: string;
  availableSpots: number;
  totalSpots: number;
  heroImage: string;
  summary: string;
  priceFrom?: number;
  shortDescription?: string;
  longDescription?: string;
  durationDays?: number;
  galleryImages?: string[];
  includes: string[];
  excludes: string[];
  policies: string[];
  requirements: string[];
  hotels: string[];
  publishStatus: "draft" | "published" | "unpublished" | "sold_out" | "archived";
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
}

export interface UpsertTripPackageInput {
  roomType: RoomType;
  pricePerPerson: number;
  deposit: number;
  paymentPlan: string;
}

export interface UpsertTripDayInput {
  dayNumber: number;
  title: string;
  description: string;
  mapPin?: string;
}

export interface CreateTripAddonInput {
  name: string;
  price: number;
}

export interface CreateTestimonialInput {
  customerName: string;
  tripTitle: string;
  quote: string;
  rating: number;
  verified: boolean;
  approved: boolean;
  city?: string;
  photoUrl?: string;
  videoUrl?: string;
  featured?: boolean;
  publishStatus?: "draft" | "published" | "archived";
}

export interface CreateGalleryAlbumInput {
  tripSlug: string;
  title: string;
  coverImage: string;
  featured: boolean;
}

export interface UpdateGalleryAlbumInput {
  tripSlug?: string;
  title?: string;
  coverImage?: string;
  featured?: boolean;
}

export interface CreateGalleryMediaInput {
  albumId: string;
  type: "photo" | "video";
  url: string;
  caption: string;
  sortOrder?: number;
}

export interface UpdateGalleryMediaInput {
  albumId?: string;
  type?: "photo" | "video";
  url?: string;
  caption?: string;
  sortOrder?: number;
}

export interface CreateOfferInput {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  code: string;
  discountType: "fixed" | "percent";
  value: number;
  tripSlug?: string;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  publishStatus?: "draft" | "published" | "archived";
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
}

function ensureConfigured() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase no está configurado");
  }
}

function toTextArray(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean);
}

function isMissingPriceFromColumn(message: string) {
  return message.includes("price_from") && message.toLowerCase().includes("column");
}

function toOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function mapTrip(
  trip: AppTripRow,
  days: AppTripDayRow[],
  packages: AppTripPackageRow[],
  addons: AppTripAddonRow[]
): Trip {
  return {
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    destination: trip.destination,
    category: trip.category,
    startDate: trip.start_date,
    endDate: trip.end_date,
    availableSpots: trip.available_spots,
    totalSpots: trip.total_spots,
    heroImage: trip.hero_image,
    summary: trip.summary,
    priceFrom: toOptionalNumber(trip.price_from),
    shortDescription: trip.short_description ?? undefined,
    longDescription: trip.long_description ?? undefined,
    durationDays: trip.duration_days ?? undefined,
    galleryImages: trip.gallery_images ?? [],
    includes: trip.includes ?? [],
    excludes: trip.excludes ?? [],
    policies: trip.policies ?? [],
    requirements: trip.requirements ?? [],
    hotels: trip.hotels ?? [],
    itinerary: days
      .sort((a, b) => a.day_number - b.day_number)
      .map((day) => ({
        dayNumber: day.day_number,
        title: day.title,
        description: day.description,
        mapPin: day.map_pin ?? undefined
      })),
    packages: packages.map((item) => ({
      id: item.id,
      roomType: item.room_type,
      pricePerPerson: Number(item.price_per_person),
      deposit: Number(item.deposit),
      paymentPlan: item.payment_plan
    })),
    addons: addons
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price)
      })),
    publishStatus: trip.publish_status,
    featured: trip.featured,
    seoTitle: trip.seo_title ?? undefined,
    seoDescription: trip.seo_description ?? undefined,
    seoOgImage: trip.seo_og_image ?? undefined
  };
}

async function hydrateTrips(rows: AppTripRow[]) {
  if (rows.length === 0) {
    return [] as Trip[];
  }

  const supabase = getSupabaseAdminClient();
  const ids = rows.map((row) => row.id);

  const [daysRes, pkgRes, addonRes] = await Promise.all([
    supabase
      .from("app_trip_days")
      .select("*")
      .in("trip_id", ids)
      .returns<AppTripDayRow[]>(),
    supabase
      .from("app_trip_packages")
      .select("*")
      .in("trip_id", ids)
      .returns<AppTripPackageRow[]>(),
    supabase
      .from("app_trip_addons")
      .select("*")
      .in("trip_id", ids)
      .returns<AppTripAddonRow[]>()
  ]);

  if (daysRes.error || pkgRes.error || addonRes.error) {
    throw new Error(
      `No se pudieron hidratar viajes: ${
        daysRes.error?.message || pkgRes.error?.message || addonRes.error?.message
      }`
    );
  }

  const daysByTrip = new Map<string, AppTripDayRow[]>();
  const packagesByTrip = new Map<string, AppTripPackageRow[]>();
  const addonsByTrip = new Map<string, AppTripAddonRow[]>();

  for (const day of daysRes.data ?? []) {
    const list = daysByTrip.get(day.trip_id) ?? [];
    list.push(day);
    daysByTrip.set(day.trip_id, list);
  }

  for (const pkg of pkgRes.data ?? []) {
    const list = packagesByTrip.get(pkg.trip_id) ?? [];
    list.push(pkg);
    packagesByTrip.set(pkg.trip_id, list);
  }

  for (const addon of addonRes.data ?? []) {
    const list = addonsByTrip.get(addon.trip_id) ?? [];
    list.push(addon);
    addonsByTrip.set(addon.trip_id, list);
  }

  return rows.map((trip) =>
    mapTrip(
      trip,
      daysByTrip.get(trip.id) ?? [],
      packagesByTrip.get(trip.id) ?? [],
      addonsByTrip.get(trip.id) ?? []
    )
  );
}

export async function listTripsService(options?: { publishedOnly?: boolean; featuredOnly?: boolean }) {
  if (!hasSupabaseConfig()) {
    return [] as Trip[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("app_trips").select("*").order("start_date", { ascending: true });

  if (options?.publishedOnly) {
    query = query.eq("publish_status", "published");
  }
  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query.returns<AppTripRow[]>();
  if (error) {
    throw new Error(`No se pudieron cargar viajes: ${error.message}`);
  }

  return hydrateTrips(data ?? []);
}

export async function getTripBySlugService(slug: string, options?: { includeUnpublished?: boolean }) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("app_trips").select("*").eq("slug", slug);

  if (!options?.includeUnpublished) {
    query = query.eq("publish_status", "published");
  }

  const { data, error } = await query.maybeSingle<AppTripRow>();
  if (error) {
    throw new Error(`No se pudo cargar viaje: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const hydrated = await hydrateTrips([data]);
  return hydrated[0] ?? null;
}

export async function createTripService(input: CreateTripInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const basePayload = {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    destination: input.destination.trim(),
    category: input.category,
    start_date: input.startDate,
    end_date: input.endDate,
    available_spots: input.availableSpots,
    total_spots: input.totalSpots,
    hero_image: input.heroImage.trim(),
    summary: input.summary.trim(),
    short_description: input.shortDescription?.trim() || null,
    long_description: input.longDescription?.trim() || null,
    duration_days: input.durationDays ?? null,
    gallery_images: toTextArray(input.galleryImages ?? []),
    includes: toTextArray(input.includes),
    excludes: toTextArray(input.excludes),
    policies: toTextArray(input.policies),
    requirements: toTextArray(input.requirements),
    hotels: toTextArray(input.hotels),
    publish_status: input.publishStatus,
    featured: input.featured,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    seo_og_image: input.seoOgImage?.trim() || null
  };

  const payloadWithPrice = {
    ...basePayload,
    price_from: input.priceFrom ?? null
  };

  let { data, error } = await supabase
    .from("app_trips")
    .insert(payloadWithPrice)
    .select("*")
    .single<AppTripRow>();

  if (error && isMissingPriceFromColumn(error.message)) {
    const fallback = await supabase.from("app_trips").insert(basePayload).select("*").single<AppTripRow>();
    data = fallback.data ?? null;
    error = fallback.error ?? null;
  }

  if (error || !data) {
    throw new Error(`No se pudo crear viaje: ${error?.message ?? "sin datos"}`);
  }

  return mapTrip(data, [], [], []);
}

export async function updateTripService(tripId: string, input: CreateTripInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const basePayload = {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    destination: input.destination.trim(),
    category: input.category,
    start_date: input.startDate,
    end_date: input.endDate,
    available_spots: input.availableSpots,
    total_spots: input.totalSpots,
    hero_image: input.heroImage.trim(),
    summary: input.summary.trim(),
    short_description: input.shortDescription?.trim() || null,
    long_description: input.longDescription?.trim() || null,
    duration_days: input.durationDays ?? null,
    gallery_images: toTextArray(input.galleryImages ?? []),
    includes: toTextArray(input.includes),
    excludes: toTextArray(input.excludes),
    policies: toTextArray(input.policies),
    requirements: toTextArray(input.requirements),
    hotels: toTextArray(input.hotels),
    publish_status: input.publishStatus,
    featured: input.featured,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    seo_og_image: input.seoOgImage?.trim() || null,
    updated_at: new Date().toISOString()
  };

  const payloadWithPrice = {
    ...basePayload,
    price_from: input.priceFrom ?? null
  };

  let { data, error } = await supabase
    .from("app_trips")
    .update(payloadWithPrice)
    .eq("id", tripId)
    .select("*")
    .single<AppTripRow>();

  if (error && isMissingPriceFromColumn(error.message)) {
    const fallback = await supabase
      .from("app_trips")
      .update(basePayload)
      .eq("id", tripId)
      .select("*")
      .single<AppTripRow>();
    data = fallback.data ?? null;
    error = fallback.error ?? null;
  }

  if (error || !data) {
    throw new Error(`No se pudo actualizar viaje: ${error?.message ?? "sin datos"}`);
  }

  const hydrated = await hydrateTrips([data]);
  return hydrated[0];
}

export async function deleteTripService(tripId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("app_trips").delete().eq("id", tripId);
  if (error) {
    throw new Error(`No se pudo eliminar viaje: ${error.message}`);
  }

  return { ok: true };
}

export async function upsertTripPackageService(tripId: string, input: UpsertTripPackageInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("app_trip_packages")
    .upsert(
      {
        trip_id: tripId,
        room_type: input.roomType,
        price_per_person: input.pricePerPerson,
        deposit: input.deposit,
        payment_plan: input.paymentPlan
      },
      { onConflict: "trip_id,room_type" }
    )
    .select("*")
    .single<AppTripPackageRow>();

  if (error || !data) {
    throw new Error(`No se pudo guardar paquete: ${error?.message ?? "sin datos"}`);
  }

  return {
    id: data.id,
    roomType: data.room_type,
    pricePerPerson: Number(data.price_per_person),
    deposit: Number(data.deposit),
    paymentPlan: data.payment_plan
  };
}

export async function upsertTripDayService(tripId: string, input: UpsertTripDayInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("app_trip_days")
    .upsert(
      {
        trip_id: tripId,
        day_number: input.dayNumber,
        title: input.title.trim(),
        description: input.description.trim(),
        map_pin: input.mapPin?.trim() || null
      },
      { onConflict: "trip_id,day_number" }
    )
    .select("*")
    .single<AppTripDayRow>();

  if (error || !data) {
    throw new Error(`No se pudo guardar día: ${error?.message ?? "sin datos"}`);
  }

  return {
    dayNumber: data.day_number,
    title: data.title,
    description: data.description,
    mapPin: data.map_pin ?? undefined
  };
}

export async function createTripAddonService(tripId: string, input: CreateTripAddonInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("app_trip_addons")
    .insert({
      trip_id: tripId,
      name: input.name.trim(),
      price: input.price,
      active: true
    })
    .select("*")
    .single<AppTripAddonRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear add-on: ${error?.message ?? "sin datos"}`);
  }

  return {
    id: data.id,
    name: data.name,
    price: Number(data.price)
  };
}

function mapTestimonial(row: AppTestimonialRow): Testimonial {
  return {
    id: row.id,
    customerName: row.customer_name,
    tripTitle: row.trip_title,
    quote: row.quote,
    rating: row.rating,
    verified: row.verified,
    approved: row.approved,
    city: row.city ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    featured: row.featured,
    publishStatus: row.publish_status
  };
}

export async function listTestimonialsService(options?: { approvedOnly?: boolean }) {
  if (!hasSupabaseConfig()) {
    return [] as Testimonial[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("app_testimonials").select("*").order("created_at", { ascending: false });

  if (options?.approvedOnly) {
    query = query.eq("approved", true).eq("verified", true).eq("publish_status", "published");
  }

  const { data, error } = await query.returns<AppTestimonialRow[]>();
  if (error) {
    throw new Error(`No se pudieron cargar testimonios: ${error.message}`);
  }

  return (data ?? []).map(mapTestimonial);
}

export async function createTestimonialService(input: CreateTestimonialInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_testimonials")
    .insert({
      customer_name: input.customerName.trim(),
      trip_title: input.tripTitle.trim(),
      quote: input.quote.trim(),
      rating: input.rating,
      verified: input.verified,
      approved: input.approved,
      city: input.city?.trim() || null,
      photo_url: input.photoUrl?.trim() || null,
      video_url: input.videoUrl?.trim() || null,
      featured: input.featured ?? false,
      publish_status: input.publishStatus ?? "published"
    })
    .select("*")
    .single<AppTestimonialRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear testimonio: ${error?.message ?? "sin datos"}`);
  }

  return mapTestimonial(data);
}

export async function updateTestimonialService(
  id: string,
  input: Partial<
    Pick<
      CreateTestimonialInput,
      "verified" | "approved" | "quote" | "rating" | "customerName" | "tripTitle" | "city" | "photoUrl" | "videoUrl" | "featured" | "publishStatus"
    >
  >
) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {};
  if (typeof input.verified === "boolean") payload.verified = input.verified;
  if (typeof input.approved === "boolean") payload.approved = input.approved;
  if (typeof input.quote === "string") payload.quote = input.quote.trim();
  if (typeof input.rating === "number") payload.rating = input.rating;
  if (typeof input.customerName === "string") payload.customer_name = input.customerName.trim();
  if (typeof input.tripTitle === "string") payload.trip_title = input.tripTitle.trim();
  if (typeof input.city === "string") payload.city = input.city.trim() || null;
  if (typeof input.photoUrl === "string") payload.photo_url = input.photoUrl.trim() || null;
  if (typeof input.videoUrl === "string") payload.video_url = input.videoUrl.trim() || null;
  if (typeof input.featured === "boolean") payload.featured = input.featured;
  if (typeof input.publishStatus === "string") payload.publish_status = input.publishStatus;

  const { data, error } = await supabase
    .from("app_testimonials")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single<AppTestimonialRow>();

  if (error || !data) {
    throw new Error(`No se pudo actualizar testimonio: ${error?.message ?? "sin datos"}`);
  }

  return mapTestimonial(data);
}

export async function deleteTestimonialService(id: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("app_testimonials").delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar testimonio: ${error.message}`);
  }

  return { ok: true };
}

function mapAlbum(row: AppGalleryAlbumRow): GalleryAlbum {
  return {
    id: row.id,
    tripSlug: row.trip_slug,
    title: row.title,
    coverImage: row.cover_image,
    featured: row.featured
  };
}

function mapMedia(row: AppGalleryMediaRow): GalleryMedia {
  return {
    id: row.id,
    albumId: row.album_id,
    type: row.media_type,
    url: row.url,
    caption: row.caption,
    sortOrder: row.sort_order
  };
}

export async function listGalleryBundlesService() {
  if (!hasSupabaseConfig()) {
    return [] as GalleryAlbumBundle[];
  }

  const supabase = getSupabaseAdminClient();
  const [albumsRes, mediaRes] = await Promise.all([
    supabase.from("app_gallery_albums").select("*").order("created_at", { ascending: false }).returns<AppGalleryAlbumRow[]>(),
    supabase.from("app_gallery_media").select("*").order("sort_order", { ascending: true }).returns<AppGalleryMediaRow[]>()
  ]);

  if (albumsRes.error || mediaRes.error) {
    throw new Error(
      `No se pudo cargar galería: ${albumsRes.error?.message || mediaRes.error?.message}`
    );
  }

  const mediaByAlbum = new Map<string, GalleryMedia[]>();
  for (const media of mediaRes.data ?? []) {
    const list = mediaByAlbum.get(media.album_id) ?? [];
    list.push(mapMedia(media));
    mediaByAlbum.set(media.album_id, list);
  }

  return (albumsRes.data ?? []).map((album) => ({
    album: mapAlbum(album),
    media: mediaByAlbum.get(album.id) ?? []
  }));
}

export async function createGalleryAlbumService(input: CreateGalleryAlbumInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_gallery_albums")
    .insert({
      trip_slug: input.tripSlug.trim(),
      title: input.title.trim(),
      cover_image: input.coverImage.trim(),
      featured: input.featured
    })
    .select("*")
    .single<AppGalleryAlbumRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear álbum: ${error?.message ?? "sin datos"}`);
  }

  return mapAlbum(data);
}

export async function updateGalleryAlbumService(albumId: string, input: UpdateGalleryAlbumInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {};

  if (typeof input.tripSlug === "string") payload.trip_slug = input.tripSlug.trim();
  if (typeof input.title === "string") payload.title = input.title.trim();
  if (typeof input.coverImage === "string") payload.cover_image = input.coverImage.trim();
  if (typeof input.featured === "boolean") payload.featured = input.featured;

  const { data, error } = await supabase
    .from("app_gallery_albums")
    .update(payload)
    .eq("id", albumId)
    .select("*")
    .single<AppGalleryAlbumRow>();

  if (error || !data) {
    throw new Error(`No se pudo actualizar álbum: ${error?.message ?? "sin datos"}`);
  }

  return mapAlbum(data);
}

export async function createGalleryMediaService(input: CreateGalleryMediaInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_gallery_media")
    .insert({
      album_id: input.albumId,
      media_type: input.type,
      url: input.url.trim(),
      caption: input.caption.trim(),
      sort_order: input.sortOrder ?? 0
    })
    .select("*")
    .single<AppGalleryMediaRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear media: ${error?.message ?? "sin datos"}`);
  }

  return mapMedia(data);
}

export async function updateGalleryMediaService(mediaId: string, input: UpdateGalleryMediaInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {};

  if (typeof input.albumId === "string") payload.album_id = input.albumId;
  if (typeof input.type === "string") payload.media_type = input.type;
  if (typeof input.url === "string") payload.url = input.url.trim();
  if (typeof input.caption === "string") payload.caption = input.caption.trim();
  if (typeof input.sortOrder === "number") payload.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("app_gallery_media")
    .update(payload)
    .eq("id", mediaId)
    .select("*")
    .single<AppGalleryMediaRow>();

  if (error || !data) {
    throw new Error(`No se pudo actualizar media: ${error?.message ?? "sin datos"}`);
  }

  return mapMedia(data);
}

export async function deleteGalleryAlbumService(albumId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("app_gallery_albums").delete().eq("id", albumId);

  if (error) {
    throw new Error(`No se pudo eliminar álbum: ${error.message}`);
  }

  return { ok: true };
}

export async function deleteGalleryMediaService(mediaId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("app_gallery_media").delete().eq("id", mediaId);

  if (error) {
    throw new Error(`No se pudo eliminar media: ${error.message}`);
  }

  return { ok: true };
}

function mapOffer(row: AppOfferRow): Offer {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    ctaHref: row.cta_href ?? undefined,
    code: row.code,
    discountType: row.discount_type,
    value: Number(row.value),
    tripSlug: row.trip_slug ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    active: row.active,
    publishStatus: row.publish_status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoOgImage: row.seo_og_image ?? undefined,
    createdAt: row.created_at
  };
}

export async function listOffersService(options?: { activeOnly?: boolean }) {
  if (!hasSupabaseConfig()) {
    return [] as Offer[];
  }

  const supabase = getSupabaseAdminClient();
  const query = supabase.from("app_offers").select("*").order("created_at", { ascending: false });
  const result = await query.returns<AppOfferRow[]>();
  if (result.error) {
    throw new Error(`No se pudieron cargar ofertas: ${result.error.message}`);
  }

  const offers = (result.data ?? []).map(mapOffer);
  if (!options?.activeOnly) {
    return offers;
  }

  const now = Date.now();
  return offers.filter((offer) => {
    if (!offer.active) {
      return false;
    }
    if (offer.startsAt && new Date(offer.startsAt).getTime() > now) {
      return false;
    }
    if (offer.endsAt && new Date(offer.endsAt).getTime() < now) {
      return false;
    }
    return true;
  });
}

export async function createOfferService(input: CreateOfferInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_offers")
    .insert({
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description.trim(),
      image_url: input.imageUrl?.trim() || null,
      cta_label: input.ctaLabel?.trim() || null,
      cta_href: input.ctaHref?.trim() || null,
      code: input.code.trim().toUpperCase(),
      discount_type: input.discountType,
      value: input.value,
      trip_slug: input.tripSlug?.trim() || null,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      active: input.active,
      publish_status: input.publishStatus ?? "published",
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
      seo_og_image: input.seoOgImage?.trim() || null
    })
    .select("*")
    .single<AppOfferRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear oferta: ${error?.message ?? "sin datos"}`);
  }

  return mapOffer(data);
}

export async function updateOfferService(
  id: string,
  input: Partial<
    Pick<
      CreateOfferInput,
      | "active"
      | "title"
      | "subtitle"
      | "description"
      | "imageUrl"
      | "ctaLabel"
      | "ctaHref"
      | "code"
      | "value"
      | "discountType"
      | "tripSlug"
      | "startsAt"
      | "endsAt"
      | "publishStatus"
      | "seoTitle"
      | "seoDescription"
      | "seoOgImage"
    >
  >
) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const payload: Record<string, unknown> = {};
  if (typeof input.active === "boolean") payload.active = input.active;
  if (typeof input.title === "string") payload.title = input.title.trim();
  if (typeof input.subtitle === "string") payload.subtitle = input.subtitle.trim() || null;
  if (typeof input.description === "string") payload.description = input.description.trim();
  if (typeof input.imageUrl === "string") payload.image_url = input.imageUrl.trim() || null;
  if (typeof input.ctaLabel === "string") payload.cta_label = input.ctaLabel.trim() || null;
  if (typeof input.ctaHref === "string") payload.cta_href = input.ctaHref.trim() || null;
  if (typeof input.code === "string") payload.code = input.code.trim().toUpperCase();
  if (typeof input.value === "number") payload.value = input.value;
  if (typeof input.discountType === "string") payload.discount_type = input.discountType;
  if (typeof input.tripSlug === "string") payload.trip_slug = input.tripSlug.trim() || null;
  if (typeof input.startsAt === "string") payload.starts_at = input.startsAt || null;
  if (typeof input.endsAt === "string") payload.ends_at = input.endsAt || null;
  if (typeof input.publishStatus === "string") payload.publish_status = input.publishStatus;
  if (typeof input.seoTitle === "string") payload.seo_title = input.seoTitle.trim() || null;
  if (typeof input.seoDescription === "string") payload.seo_description = input.seoDescription.trim() || null;
  if (typeof input.seoOgImage === "string") payload.seo_og_image = input.seoOgImage.trim() || null;

  const { data, error } = await supabase
    .from("app_offers")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single<AppOfferRow>();

  if (error || !data) {
    throw new Error(`No se pudo actualizar oferta: ${error?.message ?? "sin datos"}`);
  }

  return mapOffer(data);
}

export async function deleteOfferService(id: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("app_offers").delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar oferta: ${error.message}`);
  }

  return { ok: true };
}

function mapAutomationRule(row: AppAutomationRuleRow): AutomationRule {
  return {
    id: row.id,
    name: row.name,
    triggerEvent: row.trigger_event,
    channel: row.channel,
    active: row.active
  };
}

export async function listAutomationRulesService() {
  if (!hasSupabaseConfig()) {
    return [] as AutomationRule[];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_automation_rules")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<AppAutomationRuleRow[]>();

  if (error) {
    throw new Error(`No se pudieron cargar reglas: ${error.message}`);
  }

  return (data ?? []).map(mapAutomationRule);
}

export async function listChecklistItemsService() {
  if (!hasSupabaseConfig()) {
    return [] as string[];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_checklist_items")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .returns<AppChecklistItemRow[]>();

  if (error) {
    throw new Error(`No se pudieron cargar checklist items: ${error.message}`);
  }

  return (data ?? []).map((row) => row.label);
}
