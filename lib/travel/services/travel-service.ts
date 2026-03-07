import { createHash, randomUUID } from "crypto";
import { getFlightProvidersFromEnv } from "@/lib/travel/providers/flights";
import { getHotelProvidersFromEnv } from "@/lib/travel/providers/hotels";
import { normalizeMockFlightOffer, type MockFlightRawOffer } from "@/lib/travel/normalizers/flights";
import { normalizeMockHotelOffer, type MockHotelRawOffer } from "@/lib/travel/normalizers/hotels";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type {
  CreateTravelPackageInput,
  CreateTravelPackageItemInput,
  CreateTravelQuoteInput,
  CreateTravelQuoteItemInput,
  FlightSearchInput,
  HotelSearchInput,
  NormalizedFlightOffer,
  NormalizedHotelOffer,
  TravelAuditLog,
  TravelDashboardSnapshot,
  TravelPackage,
  TravelPackageItem,
  TravelPdfExport,
  TravelQuote,
  TravelQuoteItem,
  TravelSearchSession
} from "@/lib/travel/types";

interface TravelSearchSessionRow {
  id: string;
  created_by: string | null;
  search_type: "flights" | "hotels";
  origin: string | null;
  destination: string | null;
  check_in: string | null;
  check_out: string | null;
  departure_date: string | null;
  return_date: string | null;
  passengers_json: Record<string, unknown> | null;
  filters_json: Record<string, unknown> | null;
  provider_sources_json: string[] | null;
  raw_request_json: Record<string, unknown> | null;
  result_json: unknown[] | null;
  result_count: number;
  search_hash: string | null;
  created_at: string;
}

interface TravelQuoteRow {
  id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  destination: string;
  departure_date: string | null;
  return_date: string | null;
  currency: string;
  status: "draft" | "sent" | "approved" | "expired" | "cancelled";
  subtotal: number;
  taxes_total: number;
  markup_total: number;
  fees_total: number;
  discount_total: number;
  grand_total: number;
  notes_internal: string | null;
  notes_client: string | null;
  expires_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TravelQuoteItemRow {
  id: string;
  quote_id: string;
  item_type: TravelQuoteItem["itemType"];
  provider_name: string | null;
  external_offer_id: string | null;
  title: string;
  summary_json: Record<string, unknown> | null;
  raw_json: Record<string, unknown> | null;
  base_price: number;
  taxes: number;
  markup: number;
  fees: number;
  discount: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

interface TravelPackageRow {
  id: string;
  package_name: string;
  destination: string;
  status: TravelPackage["status"];
  visibility: TravelPackage["visibility"];
  start_date: string | null;
  end_date: string | null;
  base_quote_id: string | null;
  linked_trip_slug: string | null;
  notes: string | null;
  tags: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TravelPackageItemRow {
  id: string;
  package_id: string;
  item_type: TravelPackageItem["itemType"];
  source_quote_item_id: string | null;
  title: string;
  summary_json: Record<string, unknown> | null;
  raw_json: Record<string, unknown> | null;
  base_price: number;
  taxes: number;
  markup: number;
  fees: number;
  discount: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

interface TravelPdfExportRow {
  id: string;
  related_type: "quote" | "package" | "summary";
  related_id: string;
  file_path: string;
  file_name: string;
  status: "generated" | "failed";
  error_message: string | null;
  generated_by: string | null;
  created_at: string;
}

interface TravelAuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

interface SearchResult<T> {
  session: TravelSearchSession;
  offers: T[];
  providerSources: string[];
  warnings: string[];
  cached: boolean;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

const memory = {
  searches: [] as TravelSearchSession[],
  quotes: [] as TravelQuote[],
  packages: [] as TravelPackage[],
  exports: [] as TravelPdfExport[],
  audit: [] as TravelAuditLog[]
};

function roundMoney(value: number | undefined | null) {
  return Number((value ?? 0).toFixed(2));
}

function safeRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${entries.join(",")}}`;
}

function hashSearch(searchType: "flights" | "hotels", payload: Record<string, unknown>) {
  const normalized = stableStringify({ searchType, payload });
  return createHash("sha1").update(normalized).digest("hex");
}

function ensureArrayRecord(value: unknown): Record<string, unknown> {
  return safeRecord(value);
}

function mapSearchSession(row: TravelSearchSessionRow): TravelSearchSession {
  return {
    id: row.id,
    createdBy: row.created_by ?? undefined,
    searchType: row.search_type,
    origin: row.origin ?? undefined,
    destination: row.destination ?? undefined,
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    departureDate: row.departure_date ?? undefined,
    returnDate: row.return_date ?? undefined,
    passengers: row.passengers_json ?? {},
    filters: row.filters_json ?? {},
    providerSources: row.provider_sources_json ?? [],
    rawRequest: row.raw_request_json ?? {},
    results: row.result_json ?? [],
    resultCount: row.result_count,
    createdAt: row.created_at
  };
}

function mapQuoteItem(row: TravelQuoteItemRow): TravelQuoteItem {
  return {
    id: row.id,
    quoteId: row.quote_id,
    itemType: row.item_type,
    providerName: row.provider_name ?? undefined,
    externalOfferId: row.external_offer_id ?? undefined,
    title: row.title,
    summary: row.summary_json ?? {},
    raw: row.raw_json ?? {},
    basePrice: Number(row.base_price),
    taxes: Number(row.taxes),
    markup: Number(row.markup),
    fees: Number(row.fees),
    discount: Number(row.discount),
    totalPrice: Number(row.total_price),
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

function mapQuote(row: TravelQuoteRow, items: TravelQuoteItem[]): TravelQuote {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? undefined,
    clientEmail: row.client_email ?? undefined,
    destination: row.destination,
    departureDate: row.departure_date ?? undefined,
    returnDate: row.return_date ?? undefined,
    currency: row.currency,
    status: row.status,
    subtotal: Number(row.subtotal),
    taxesTotal: Number(row.taxes_total),
    markupTotal: Number(row.markup_total),
    feesTotal: Number(row.fees_total),
    discountTotal: Number(row.discount_total),
    grandTotal: Number(row.grand_total),
    notesInternal: row.notes_internal ?? undefined,
    notesClient: row.notes_client ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items
  };
}

function mapPackageItem(row: TravelPackageItemRow): TravelPackageItem {
  return {
    id: row.id,
    packageId: row.package_id,
    itemType: row.item_type,
    sourceQuoteItemId: row.source_quote_item_id ?? undefined,
    title: row.title,
    summary: row.summary_json ?? {},
    raw: row.raw_json ?? {},
    basePrice: Number(row.base_price),
    taxes: Number(row.taxes),
    markup: Number(row.markup),
    fees: Number(row.fees),
    discount: Number(row.discount),
    totalPrice: Number(row.total_price),
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

function mapPackage(row: TravelPackageRow, items: TravelPackageItem[]): TravelPackage {
  return {
    id: row.id,
    packageName: row.package_name,
    destination: row.destination,
    status: row.status,
    visibility: row.visibility,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    baseQuoteId: row.base_quote_id ?? undefined,
    linkedTripSlug: row.linked_trip_slug ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items
  };
}

function mapPdfExport(row: TravelPdfExportRow): TravelPdfExport {
  return {
    id: row.id,
    relatedType: row.related_type,
    relatedId: row.related_id,
    filePath: row.file_path,
    fileName: row.file_name,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    generatedBy: row.generated_by ?? undefined,
    createdAt: row.created_at
  };
}

function mapAudit(row: TravelAuditLogRow): TravelAuditLog {
  return {
    id: row.id,
    actorId: row.actor_id ?? undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    metadata: row.metadata_json ?? {},
    createdAt: row.created_at
  };
}

function toQuoteItemPayload(input: CreateTravelQuoteItemInput, index: number) {
  const basePrice = roundMoney(input.basePrice);
  const taxes = roundMoney(input.taxes);
  const markup = roundMoney(input.markup);
  const fees = roundMoney(input.fees);
  const discount = roundMoney(input.discount);
  const totalPrice = roundMoney(basePrice + taxes + markup + fees - discount);
  return {
    itemType: input.itemType,
    providerName: input.providerName?.trim() || undefined,
    externalOfferId: input.externalOfferId?.trim() || undefined,
    title: input.title.trim(),
    summary: ensureArrayRecord(input.summary),
    raw: ensureArrayRecord(input.raw),
    basePrice,
    taxes,
    markup,
    fees,
    discount,
    totalPrice,
    sortOrder: input.sortOrder ?? index
  };
}

function toPackageItemPayload(input: CreateTravelPackageItemInput, index: number) {
  const basePrice = roundMoney(input.basePrice);
  const taxes = roundMoney(input.taxes);
  const markup = roundMoney(input.markup);
  const fees = roundMoney(input.fees);
  const discount = roundMoney(input.discount);
  const totalPrice = roundMoney(basePrice + taxes + markup + fees - discount);
  return {
    itemType: input.itemType,
    sourceQuoteItemId: input.sourceQuoteItemId,
    title: input.title.trim(),
    summary: ensureArrayRecord(input.summary),
    raw: ensureArrayRecord(input.raw),
    basePrice,
    taxes,
    markup,
    fees,
    discount,
    totalPrice,
    sortOrder: input.sortOrder ?? index
  };
}

function summarizeQuoteTotals(items: ReturnType<typeof toQuoteItemPayload>[], extras: {
  taxesTotal?: number;
  markupTotal?: number;
  feesTotal?: number;
  discountTotal?: number;
}) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.basePrice, 0));
  const taxesItems = roundMoney(items.reduce((sum, item) => sum + item.taxes, 0));
  const markupItems = roundMoney(items.reduce((sum, item) => sum + item.markup, 0));
  const feesItems = roundMoney(items.reduce((sum, item) => sum + item.fees, 0));
  const discountItems = roundMoney(items.reduce((sum, item) => sum + item.discount, 0));
  const taxesTotal = roundMoney(taxesItems + roundMoney(extras.taxesTotal));
  const markupTotal = roundMoney(markupItems + roundMoney(extras.markupTotal));
  const feesTotal = roundMoney(feesItems + roundMoney(extras.feesTotal));
  const discountTotal = roundMoney(discountItems + roundMoney(extras.discountTotal));
  const grandTotal = roundMoney(subtotal + taxesTotal + markupTotal + feesTotal - discountTotal);

  return {
    subtotal,
    taxesTotal,
    markupTotal,
    feesTotal,
    discountTotal,
    grandTotal
  };
}

function createQuoteNumber() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  return `TQ-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function runFlightProviders(input: FlightSearchInput) {
  const providers = getFlightProvidersFromEnv();
  const results = await Promise.allSettled(providers.map((provider) => provider.search(input)));
  const offers: NormalizedFlightOffer[] = [];
  const sources: string[] = [];
  const warnings: string[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const outcome = results[index];
    const provider = providers[index];

    if (outcome.status === "rejected") {
      warnings.push(`${provider.key}: ${outcome.reason instanceof Error ? outcome.reason.message : "error"}`);
      continue;
    }

    sources.push(outcome.value.provider);
    if (provider.key === "mock_flights" || provider.key === "mock") {
      const normalized = (outcome.value.offers as MockFlightRawOffer[]).map((raw) =>
        normalizeMockFlightOffer(raw, outcome.value.provider, input.cabinClass, input.currency)
      );
      offers.push(...normalized);
    }
  }

  return {
    offers: offers.sort((a, b) => a.totalPrice - b.totalPrice),
    sources,
    warnings
  };
}

async function runHotelProviders(input: HotelSearchInput) {
  const providers = getHotelProvidersFromEnv();
  const results = await Promise.allSettled(providers.map((provider) => provider.search(input)));
  const offers: NormalizedHotelOffer[] = [];
  const sources: string[] = [];
  const warnings: string[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const outcome = results[index];
    const provider = providers[index];

    if (outcome.status === "rejected") {
      warnings.push(`${provider.key}: ${outcome.reason instanceof Error ? outcome.reason.message : "error"}`);
      continue;
    }

    sources.push(outcome.value.provider);
    if (provider.key === "mock_hotels" || provider.key === "mock") {
      const normalized = (outcome.value.offers as MockHotelRawOffer[]).map((raw) =>
        normalizeMockHotelOffer(raw, outcome.value.provider, input.currency)
      );
      offers.push(...normalized);
    }
  }

  return {
    offers: offers.sort((a, b) => a.totalPrice - b.totalPrice),
    sources,
    warnings
  };
}

async function getRecentCachedSession(searchType: "flights" | "hotels", hash: string) {
  if (!hasSupabaseConfig()) {
    const found = memory.searches.find((item) => item.searchType === searchType && item.rawRequest.searchHash === hash);
    if (!found) {
      return null;
    }

    const age = Date.now() - new Date(found.createdAt).getTime();
    return age <= TEN_MINUTES_MS ? found : null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_search_sessions")
    .select("*")
    .eq("search_type", searchType)
    .eq("search_hash", hash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<TravelSearchSessionRow>();

  if (result.error || !result.data) {
    return null;
  }

  const mapped = mapSearchSession(result.data);
  const age = Date.now() - new Date(mapped.createdAt).getTime();
  return age <= TEN_MINUTES_MS ? mapped : null;
}

export async function appendTravelAuditLogService(
  actorId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | undefined,
  metadata?: Record<string, unknown>
) {
  if (!hasSupabaseConfig()) {
    memory.audit.unshift({
      id: randomUUID(),
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? {},
      createdAt: new Date().toISOString()
    });
    memory.audit = memory.audit.slice(0, 200);
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("app_travel_audit_logs").insert({
    actor_id: actorId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata_json: metadata ?? {}
  });
}

export async function searchFlightsService(input: FlightSearchInput, actorId?: string): Promise<SearchResult<NormalizedFlightOffer>> {
  const searchHash = hashSearch("flights", safeRecord(input));
  const cached = await getRecentCachedSession("flights", searchHash);
  if (cached) {
    return {
      session: cached,
      offers: (cached.results as NormalizedFlightOffer[]) ?? [],
      providerSources: cached.providerSources,
      warnings: [],
      cached: true
    };
  }

  const searchResult = await runFlightProviders(input);
  if (searchResult.offers.length === 0 && searchResult.warnings.length > 0) {
    throw new Error("No se pudieron obtener vuelos desde proveedores activos.");
  }

  const sessionPayload = {
    created_by: actorId ?? null,
    search_type: "flights" as const,
    origin: input.origin,
    destination: input.destination,
    departure_date: input.departureDate,
    return_date: input.returnDate ?? null,
    passengers_json: {
      adults: input.adults,
      children: input.children,
      infants: input.infants
    },
    filters_json: {
      cabinClass: input.cabinClass,
      includeBags: Boolean(input.includeBags),
      directOnly: Boolean(input.directOnly),
      airline: input.airline ?? "",
      minPrice: input.minPrice ?? null,
      maxPrice: input.maxPrice ?? null,
      flexibleDates: Boolean(input.flexibleDates),
      currency: input.currency
    },
    provider_sources_json: searchResult.sources,
    raw_request_json: {
      ...safeRecord(input),
      searchHash
    },
    result_json: searchResult.offers,
    result_count: searchResult.offers.length,
    search_hash: searchHash
  };

  let session: TravelSearchSession;

  if (!hasSupabaseConfig()) {
    session = {
      id: randomUUID(),
      createdBy: actorId,
      searchType: "flights",
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: sessionPayload.passengers_json,
      filters: sessionPayload.filters_json,
      providerSources: sessionPayload.provider_sources_json,
      rawRequest: sessionPayload.raw_request_json,
      results: searchResult.offers,
      resultCount: searchResult.offers.length,
      createdAt: new Date().toISOString()
    };
    memory.searches.unshift(session);
    memory.searches = memory.searches.slice(0, 100);
  } else {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("app_travel_search_sessions")
      .insert(sessionPayload)
      .select("*")
      .single<TravelSearchSessionRow>();

    if (inserted.error || !inserted.data) {
      throw new Error(`No se pudo guardar sesión de búsqueda de vuelos: ${inserted.error?.message ?? "sin datos"}`);
    }
    session = mapSearchSession(inserted.data);
  }

  await appendTravelAuditLogService(actorId, "travel_search_executed", "flight_search", session.id, {
    origin: input.origin,
    destination: input.destination,
    providers: searchResult.sources,
    resultCount: searchResult.offers.length
  });

  return {
    session,
    offers: searchResult.offers,
    providerSources: searchResult.sources,
    warnings: searchResult.warnings,
    cached: false
  };
}

export async function searchHotelsService(input: HotelSearchInput, actorId?: string): Promise<SearchResult<NormalizedHotelOffer>> {
  const searchHash = hashSearch("hotels", safeRecord(input));
  const cached = await getRecentCachedSession("hotels", searchHash);
  if (cached) {
    return {
      session: cached,
      offers: (cached.results as NormalizedHotelOffer[]) ?? [],
      providerSources: cached.providerSources,
      warnings: [],
      cached: true
    };
  }

  const searchResult = await runHotelProviders(input);
  if (searchResult.offers.length === 0 && searchResult.warnings.length > 0) {
    throw new Error("No se pudieron obtener hoteles desde proveedores activos.");
  }

  const sessionPayload = {
    created_by: actorId ?? null,
    search_type: "hotels" as const,
    destination: input.destination,
    check_in: input.checkIn,
    check_out: input.checkOut,
    passengers_json: {
      adults: input.adults,
      children: input.children,
      rooms: input.rooms
    },
    filters_json: {
      hotelName: input.hotelName ?? "",
      stars: input.stars ?? null,
      minPrice: input.minPrice ?? null,
      maxPrice: input.maxPrice ?? null,
      amenities: input.amenities ?? [],
      neighborhood: input.neighborhood ?? "",
      flexibleCancellation: Boolean(input.flexibleCancellation),
      breakfastIncluded: Boolean(input.breakfastIncluded),
      currency: input.currency
    },
    provider_sources_json: searchResult.sources,
    raw_request_json: {
      ...safeRecord(input),
      searchHash
    },
    result_json: searchResult.offers,
    result_count: searchResult.offers.length,
    search_hash: searchHash
  };

  let session: TravelSearchSession;
  if (!hasSupabaseConfig()) {
    session = {
      id: randomUUID(),
      createdBy: actorId,
      searchType: "hotels",
      destination: input.destination,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      passengers: sessionPayload.passengers_json,
      filters: sessionPayload.filters_json,
      providerSources: sessionPayload.provider_sources_json,
      rawRequest: sessionPayload.raw_request_json,
      results: searchResult.offers,
      resultCount: searchResult.offers.length,
      createdAt: new Date().toISOString()
    };
    memory.searches.unshift(session);
    memory.searches = memory.searches.slice(0, 100);
  } else {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("app_travel_search_sessions")
      .insert(sessionPayload)
      .select("*")
      .single<TravelSearchSessionRow>();

    if (inserted.error || !inserted.data) {
      throw new Error(`No se pudo guardar sesión de búsqueda de hoteles: ${inserted.error?.message ?? "sin datos"}`);
    }
    session = mapSearchSession(inserted.data);
  }

  await appendTravelAuditLogService(actorId, "travel_search_executed", "hotel_search", session.id, {
    destination: input.destination,
    providers: searchResult.sources,
    resultCount: searchResult.offers.length
  });

  return {
    session,
    offers: searchResult.offers,
    providerSources: searchResult.sources,
    warnings: searchResult.warnings,
    cached: false
  };
}

export async function listTravelSearchSessionsService(limit = 30) {
  if (!hasSupabaseConfig()) {
    return memory.searches.slice(0, limit);
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_search_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TravelSearchSessionRow[]>();

  if (result.error) {
    throw new Error(`No se pudo cargar historial de búsquedas: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapSearchSession);
}

export async function listTravelQuotesService() {
  if (!hasSupabaseConfig()) {
    return memory.quotes;
  }

  const supabase = getSupabaseAdminClient();
  const [quotesResult, itemsResult] = await Promise.all([
    supabase.from("app_travel_quotes").select("*").order("created_at", { ascending: false }).returns<TravelQuoteRow[]>(),
    supabase.from("app_travel_quote_items").select("*").order("sort_order", { ascending: true }).returns<TravelQuoteItemRow[]>()
  ]);

  if (quotesResult.error || itemsResult.error) {
    throw new Error(
      `No se pudo cargar cotizaciones: ${quotesResult.error?.message ?? itemsResult.error?.message}`
    );
  }

  const itemsByQuote = new Map<string, TravelQuoteItem[]>();
  for (const row of itemsResult.data ?? []) {
    const list = itemsByQuote.get(row.quote_id) ?? [];
    list.push(mapQuoteItem(row));
    itemsByQuote.set(row.quote_id, list);
  }

  return (quotesResult.data ?? []).map((row) => mapQuote(row, itemsByQuote.get(row.id) ?? []));
}

export async function getTravelQuoteByIdService(quoteId: string) {
  if (!hasSupabaseConfig()) {
    return memory.quotes.find((item) => item.id === quoteId) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const [quoteResult, itemsResult] = await Promise.all([
    supabase.from("app_travel_quotes").select("*").eq("id", quoteId).maybeSingle<TravelQuoteRow>(),
    supabase.from("app_travel_quote_items").select("*").eq("quote_id", quoteId).order("sort_order", { ascending: true }).returns<TravelQuoteItemRow[]>()
  ]);

  if (quoteResult.error) {
    throw new Error(`No se pudo cargar cotización: ${quoteResult.error.message}`);
  }
  if (itemsResult.error) {
    throw new Error(`No se pudieron cargar items de cotización: ${itemsResult.error.message}`);
  }
  if (!quoteResult.data) {
    return null;
  }

  return mapQuote(quoteResult.data, (itemsResult.data ?? []).map(mapQuoteItem));
}

export async function createTravelQuoteService(input: CreateTravelQuoteInput, actorId?: string) {
  const itemsPayload = input.items.map((item, index) => toQuoteItemPayload(item, index));
  const totals = summarizeQuoteTotals(itemsPayload, {
    taxesTotal: input.taxesTotal,
    markupTotal: input.markupTotal,
    feesTotal: input.feesTotal,
    discountTotal: input.discountTotal
  });
  const quoteNumber = createQuoteNumber();
  const now = new Date().toISOString();

  if (!hasSupabaseConfig()) {
    const quoteId = randomUUID();
    const items: TravelQuoteItem[] = itemsPayload.map((item) => ({
      id: randomUUID(),
      quoteId,
      itemType: item.itemType,
      providerName: item.providerName,
      externalOfferId: item.externalOfferId,
      title: item.title,
      summary: item.summary,
      raw: item.raw,
      basePrice: item.basePrice,
      taxes: item.taxes,
      markup: item.markup,
      fees: item.fees,
      discount: item.discount,
      totalPrice: item.totalPrice,
      sortOrder: item.sortOrder,
      createdAt: now
    }));

    const quote: TravelQuote = {
      id: quoteId,
      quoteNumber,
      clientId: input.clientId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      currency: input.currency ?? "USD",
      status: input.status ?? "draft",
      subtotal: totals.subtotal,
      taxesTotal: totals.taxesTotal,
      markupTotal: totals.markupTotal,
      feesTotal: totals.feesTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
      notesInternal: input.notesInternal,
      notesClient: input.notesClient,
      expiresAt: input.expiresAt,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
      updatedAt: now,
      items
    };
    memory.quotes.unshift(quote);
    await appendTravelAuditLogService(actorId, "quote_created", "travel_quote", quote.id, {
      quoteNumber: quote.quoteNumber,
      destination: quote.destination
    });
    return quote;
  }

  const supabase = getSupabaseAdminClient();
  const quoteInsert = await supabase
    .from("app_travel_quotes")
    .insert({
      quote_number: quoteNumber,
      client_id: input.clientId ?? null,
      client_name: input.clientName?.trim() || null,
      client_email: input.clientEmail?.trim().toLowerCase() || null,
      destination: input.destination.trim(),
      departure_date: input.departureDate ?? null,
      return_date: input.returnDate ?? null,
      currency: input.currency ?? "USD",
      status: input.status ?? "draft",
      subtotal: totals.subtotal,
      taxes_total: totals.taxesTotal,
      markup_total: totals.markupTotal,
      fees_total: totals.feesTotal,
      discount_total: totals.discountTotal,
      grand_total: totals.grandTotal,
      notes_internal: input.notesInternal?.trim() || null,
      notes_client: input.notesClient?.trim() || null,
      expires_at: input.expiresAt ?? null,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      updated_at: now
    })
    .select("*")
    .single<TravelQuoteRow>();

  if (quoteInsert.error || !quoteInsert.data) {
    throw new Error(`No se pudo crear cotización: ${quoteInsert.error?.message ?? "sin datos"}`);
  }

  const itemRows = itemsPayload.map((item) => ({
    quote_id: quoteInsert.data.id,
    item_type: item.itemType,
    provider_name: item.providerName ?? null,
    external_offer_id: item.externalOfferId ?? null,
    title: item.title,
    summary_json: item.summary,
    raw_json: item.raw,
    base_price: item.basePrice,
    taxes: item.taxes,
    markup: item.markup,
    fees: item.fees,
    discount: item.discount,
    total_price: item.totalPrice,
    sort_order: item.sortOrder
  }));

  if (itemRows.length > 0) {
    const itemsInsert = await supabase.from("app_travel_quote_items").insert(itemRows);
    if (itemsInsert.error) {
      throw new Error(`No se pudieron guardar items de cotización: ${itemsInsert.error.message}`);
    }
  }

  const created = await getTravelQuoteByIdService(quoteInsert.data.id);
  if (!created) {
    throw new Error("No se pudo hidratar cotización creada.");
  }

  await appendTravelAuditLogService(actorId, "quote_created", "travel_quote", created.id, {
    quoteNumber: created.quoteNumber,
    destination: created.destination
  });

  return created;
}

export async function updateTravelQuoteService(
  quoteId: string,
  input: Partial<CreateTravelQuoteInput> & { status?: TravelQuote["status"] },
  actorId?: string
) {
  const existing = await getTravelQuoteByIdService(quoteId);
  if (!existing) {
    throw new Error("Cotización no encontrada");
  }

  const nextItemsPayload = input.items
    ? input.items.map((item, index) => toQuoteItemPayload(item, index))
    : existing.items.map((item, index) =>
        toQuoteItemPayload(
          {
            itemType: item.itemType,
            providerName: item.providerName,
            externalOfferId: item.externalOfferId,
            title: item.title,
            summary: item.summary,
            raw: item.raw,
            basePrice: item.basePrice,
            taxes: item.taxes,
            markup: item.markup,
            fees: item.fees,
            discount: item.discount,
            sortOrder: item.sortOrder
          },
          index
        )
      );

  const totals = summarizeQuoteTotals(nextItemsPayload, {
    taxesTotal: input.taxesTotal,
    markupTotal: input.markupTotal,
    feesTotal: input.feesTotal,
    discountTotal: input.discountTotal
  });
  const now = new Date().toISOString();

  if (!hasSupabaseConfig()) {
    const idx = memory.quotes.findIndex((quote) => quote.id === quoteId);
    if (idx < 0) {
      throw new Error("Cotización no encontrada");
    }

    const updated: TravelQuote = {
      ...existing,
      clientId: input.clientId ?? existing.clientId,
      clientName: input.clientName ?? existing.clientName,
      clientEmail: input.clientEmail ?? existing.clientEmail,
      destination: input.destination ?? existing.destination,
      departureDate: input.departureDate ?? existing.departureDate,
      returnDate: input.returnDate ?? existing.returnDate,
      currency: input.currency ?? existing.currency,
      status: input.status ?? existing.status,
      subtotal: totals.subtotal,
      taxesTotal: totals.taxesTotal,
      markupTotal: totals.markupTotal,
      feesTotal: totals.feesTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
      notesInternal: input.notesInternal ?? existing.notesInternal,
      notesClient: input.notesClient ?? existing.notesClient,
      expiresAt: input.expiresAt ?? existing.expiresAt,
      updatedBy: actorId ?? existing.updatedBy,
      updatedAt: now,
      items: nextItemsPayload.map((item) => ({
        id: randomUUID(),
        quoteId,
        itemType: item.itemType,
        providerName: item.providerName,
        externalOfferId: item.externalOfferId,
        title: item.title,
        summary: item.summary,
        raw: item.raw,
        basePrice: item.basePrice,
        taxes: item.taxes,
        markup: item.markup,
        fees: item.fees,
        discount: item.discount,
        totalPrice: item.totalPrice,
        sortOrder: item.sortOrder,
        createdAt: now
      }))
    };
    memory.quotes[idx] = updated;
    await appendTravelAuditLogService(actorId, "quote_updated", "travel_quote", quoteId, {
      status: updated.status
    });
    return updated;
  }

  const supabase = getSupabaseAdminClient();
  const quoteUpdate = await supabase
    .from("app_travel_quotes")
    .update({
      client_id: input.clientId ?? existing.clientId ?? null,
      client_name: input.clientName?.trim() || existing.clientName || null,
      client_email: input.clientEmail?.trim().toLowerCase() || existing.clientEmail || null,
      destination: input.destination?.trim() || existing.destination,
      departure_date: input.departureDate ?? existing.departureDate ?? null,
      return_date: input.returnDate ?? existing.returnDate ?? null,
      currency: input.currency ?? existing.currency,
      status: input.status ?? existing.status,
      subtotal: totals.subtotal,
      taxes_total: totals.taxesTotal,
      markup_total: totals.markupTotal,
      fees_total: totals.feesTotal,
      discount_total: totals.discountTotal,
      grand_total: totals.grandTotal,
      notes_internal: input.notesInternal?.trim() || existing.notesInternal || null,
      notes_client: input.notesClient?.trim() || existing.notesClient || null,
      expires_at: input.expiresAt ?? existing.expiresAt ?? null,
      updated_by: actorId ?? existing.updatedBy ?? null,
      updated_at: now
    })
    .eq("id", quoteId);

  if (quoteUpdate.error) {
    throw new Error(`No se pudo actualizar cotización: ${quoteUpdate.error.message}`);
  }

  if (input.items) {
    const deleted = await supabase.from("app_travel_quote_items").delete().eq("quote_id", quoteId);
    if (deleted.error) {
      throw new Error(`No se pudieron reemplazar items de cotización: ${deleted.error.message}`);
    }

    if (nextItemsPayload.length > 0) {
      const inserted = await supabase.from("app_travel_quote_items").insert(
        nextItemsPayload.map((item) => ({
          quote_id: quoteId,
          item_type: item.itemType,
          provider_name: item.providerName ?? null,
          external_offer_id: item.externalOfferId ?? null,
          title: item.title,
          summary_json: item.summary,
          raw_json: item.raw,
          base_price: item.basePrice,
          taxes: item.taxes,
          markup: item.markup,
          fees: item.fees,
          discount: item.discount,
          total_price: item.totalPrice,
          sort_order: item.sortOrder
        }))
      );

      if (inserted.error) {
        throw new Error(`No se pudieron guardar items actualizados: ${inserted.error.message}`);
      }
    }
  }

  const updated = await getTravelQuoteByIdService(quoteId);
  if (!updated) {
    throw new Error("No se pudo cargar cotización actualizada");
  }

  await appendTravelAuditLogService(actorId, "quote_updated", "travel_quote", updated.id, {
    status: updated.status
  });

  return updated;
}

export async function listTravelPackagesService() {
  if (!hasSupabaseConfig()) {
    return memory.packages;
  }

  const supabase = getSupabaseAdminClient();
  const [packagesResult, itemsResult] = await Promise.all([
    supabase.from("app_travel_packages").select("*").order("created_at", { ascending: false }).returns<TravelPackageRow[]>(),
    supabase.from("app_travel_package_items").select("*").order("sort_order", { ascending: true }).returns<TravelPackageItemRow[]>()
  ]);

  if (packagesResult.error || itemsResult.error) {
    throw new Error(
      `No se pudieron cargar paquetes de viaje: ${packagesResult.error?.message ?? itemsResult.error?.message}`
    );
  }

  const itemsByPackage = new Map<string, TravelPackageItem[]>();
  for (const row of itemsResult.data ?? []) {
    const list = itemsByPackage.get(row.package_id) ?? [];
    list.push(mapPackageItem(row));
    itemsByPackage.set(row.package_id, list);
  }

  return (packagesResult.data ?? []).map((row) => mapPackage(row, itemsByPackage.get(row.id) ?? []));
}

export async function getTravelPackageByIdService(packageId: string) {
  if (!hasSupabaseConfig()) {
    return memory.packages.find((item) => item.id === packageId) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const [packageResult, itemsResult] = await Promise.all([
    supabase.from("app_travel_packages").select("*").eq("id", packageId).maybeSingle<TravelPackageRow>(),
    supabase
      .from("app_travel_package_items")
      .select("*")
      .eq("package_id", packageId)
      .order("sort_order", { ascending: true })
      .returns<TravelPackageItemRow[]>()
  ]);

  if (packageResult.error) {
    throw new Error(`No se pudo cargar paquete: ${packageResult.error.message}`);
  }
  if (itemsResult.error) {
    throw new Error(`No se pudieron cargar items de paquete: ${itemsResult.error.message}`);
  }
  if (!packageResult.data) {
    return null;
  }

  return mapPackage(packageResult.data, (itemsResult.data ?? []).map(mapPackageItem));
}

export async function createTravelPackageService(input: CreateTravelPackageInput, actorId?: string) {
  const now = new Date().toISOString();
  const packageItems = (input.items ?? []).map((item, index) => toPackageItemPayload(item, index));

  if (!hasSupabaseConfig()) {
    const packageId = randomUUID();
    const pkg: TravelPackage = {
      id: packageId,
      packageName: input.packageName.trim(),
      destination: input.destination.trim(),
      status: input.status ?? "draft",
      visibility: input.visibility ?? "internal",
      startDate: input.startDate,
      endDate: input.endDate,
      baseQuoteId: input.baseQuoteId,
      linkedTripSlug: input.linkedTripSlug,
      notes: input.notes,
      tags: input.tags ?? [],
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
      updatedAt: now,
      items: packageItems.map((item) => ({
        id: randomUUID(),
        packageId,
        itemType: item.itemType,
        sourceQuoteItemId: item.sourceQuoteItemId,
        title: item.title,
        summary: item.summary,
        raw: item.raw,
        basePrice: item.basePrice,
        taxes: item.taxes,
        markup: item.markup,
        fees: item.fees,
        discount: item.discount,
        totalPrice: item.totalPrice,
        sortOrder: item.sortOrder,
        createdAt: now
      }))
    };
    memory.packages.unshift(pkg);
    await appendTravelAuditLogService(actorId, "package_created", "travel_package", pkg.id, {
      packageName: pkg.packageName
    });
    return pkg;
  }

  const supabase = getSupabaseAdminClient();
  const pkgInsert = await supabase
    .from("app_travel_packages")
    .insert({
      package_name: input.packageName.trim(),
      destination: input.destination.trim(),
      status: input.status ?? "draft",
      visibility: input.visibility ?? "internal",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      base_quote_id: input.baseQuoteId ?? null,
      linked_trip_slug: input.linkedTripSlug ?? null,
      notes: input.notes?.trim() || null,
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      updated_at: now
    })
    .select("*")
    .single<TravelPackageRow>();

  if (pkgInsert.error || !pkgInsert.data) {
    throw new Error(`No se pudo crear paquete de viaje: ${pkgInsert.error?.message ?? "sin datos"}`);
  }

  if (packageItems.length > 0) {
    const itemInsert = await supabase.from("app_travel_package_items").insert(
      packageItems.map((item) => ({
        package_id: pkgInsert.data.id,
        item_type: item.itemType,
        source_quote_item_id: item.sourceQuoteItemId ?? null,
        title: item.title,
        summary_json: item.summary,
        raw_json: item.raw,
        base_price: item.basePrice,
        taxes: item.taxes,
        markup: item.markup,
        fees: item.fees,
        discount: item.discount,
        total_price: item.totalPrice,
        sort_order: item.sortOrder
      }))
    );

    if (itemInsert.error) {
      throw new Error(`No se pudieron guardar items de paquete: ${itemInsert.error.message}`);
    }
  }

  const created = await getTravelPackageByIdService(pkgInsert.data.id);
  if (!created) {
    throw new Error("No se pudo hidratar paquete creado");
  }

  await appendTravelAuditLogService(actorId, "package_created", "travel_package", created.id, {
    packageName: created.packageName
  });
  return created;
}

export async function updateTravelPackageService(
  packageId: string,
  input: Partial<CreateTravelPackageInput> & { status?: TravelPackage["status"] },
  actorId?: string
) {
  const existing = await getTravelPackageByIdService(packageId);
  if (!existing) {
    throw new Error("Paquete no encontrado");
  }

  const now = new Date().toISOString();
  if (!hasSupabaseConfig()) {
    const idx = memory.packages.findIndex((item) => item.id === packageId);
    if (idx < 0) {
      throw new Error("Paquete no encontrado");
    }
    const updated: TravelPackage = {
      ...existing,
      packageName: input.packageName ?? existing.packageName,
      destination: input.destination ?? existing.destination,
      status: input.status ?? existing.status,
      visibility: input.visibility ?? existing.visibility,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      baseQuoteId: input.baseQuoteId ?? existing.baseQuoteId,
      linkedTripSlug: input.linkedTripSlug ?? existing.linkedTripSlug,
      notes: input.notes ?? existing.notes,
      tags: input.tags ?? existing.tags,
      updatedBy: actorId ?? existing.updatedBy,
      updatedAt: now,
      items: input.items
        ? input.items.map((item, index) => {
            const normalized = toPackageItemPayload(item, index);
            return {
              id: randomUUID(),
              packageId,
              itemType: normalized.itemType,
              sourceQuoteItemId: normalized.sourceQuoteItemId,
              title: normalized.title,
              summary: normalized.summary,
              raw: normalized.raw,
              basePrice: normalized.basePrice,
              taxes: normalized.taxes,
              markup: normalized.markup,
              fees: normalized.fees,
              discount: normalized.discount,
              totalPrice: normalized.totalPrice,
              sortOrder: normalized.sortOrder,
              createdAt: now
            };
          })
        : existing.items
    };
    memory.packages[idx] = updated;
    await appendTravelAuditLogService(actorId, "package_updated", "travel_package", packageId, {
      status: updated.status
    });
    return updated;
  }

  const supabase = getSupabaseAdminClient();
  const updateResult = await supabase
    .from("app_travel_packages")
    .update({
      package_name: input.packageName?.trim() || existing.packageName,
      destination: input.destination?.trim() || existing.destination,
      status: input.status ?? existing.status,
      visibility: input.visibility ?? existing.visibility,
      start_date: input.startDate ?? existing.startDate ?? null,
      end_date: input.endDate ?? existing.endDate ?? null,
      base_quote_id: input.baseQuoteId ?? existing.baseQuoteId ?? null,
      linked_trip_slug: input.linkedTripSlug ?? existing.linkedTripSlug ?? null,
      notes: input.notes?.trim() || existing.notes || null,
      tags: (input.tags ?? existing.tags).map((tag) => tag.trim()).filter(Boolean),
      updated_by: actorId ?? existing.updatedBy ?? null,
      updated_at: now
    })
    .eq("id", packageId);

  if (updateResult.error) {
    throw new Error(`No se pudo actualizar paquete: ${updateResult.error.message}`);
  }

  if (input.items) {
    const deleted = await supabase.from("app_travel_package_items").delete().eq("package_id", packageId);
    if (deleted.error) {
      throw new Error(`No se pudieron reemplazar items de paquete: ${deleted.error.message}`);
    }

    const normalizedItems = input.items.map((item, index) => toPackageItemPayload(item, index));
    if (normalizedItems.length > 0) {
      const inserted = await supabase.from("app_travel_package_items").insert(
        normalizedItems.map((item) => ({
          package_id: packageId,
          item_type: item.itemType,
          source_quote_item_id: item.sourceQuoteItemId ?? null,
          title: item.title,
          summary_json: item.summary,
          raw_json: item.raw,
          base_price: item.basePrice,
          taxes: item.taxes,
          markup: item.markup,
          fees: item.fees,
          discount: item.discount,
          total_price: item.totalPrice,
          sort_order: item.sortOrder
        }))
      );
      if (inserted.error) {
        throw new Error(`No se pudieron guardar items actualizados del paquete: ${inserted.error.message}`);
      }
    }
  }

  const updated = await getTravelPackageByIdService(packageId);
  if (!updated) {
    throw new Error("No se pudo cargar paquete actualizado");
  }
  await appendTravelAuditLogService(actorId, "package_updated", "travel_package", packageId, {
    status: updated.status
  });
  return updated;
}

export async function addTravelPackageItemService(packageId: string, input: CreateTravelPackageItemInput, actorId?: string) {
  const existing = await getTravelPackageByIdService(packageId);
  if (!existing) {
    throw new Error("Paquete no encontrado");
  }

  const normalized = toPackageItemPayload(input, existing.items.length + 1);
  if (!hasSupabaseConfig()) {
    const idx = memory.packages.findIndex((item) => item.id === packageId);
    if (idx < 0) {
      throw new Error("Paquete no encontrado");
    }
    const item: TravelPackageItem = {
      id: randomUUID(),
      packageId,
      itemType: normalized.itemType,
      sourceQuoteItemId: normalized.sourceQuoteItemId,
      title: normalized.title,
      summary: normalized.summary,
      raw: normalized.raw,
      basePrice: normalized.basePrice,
      taxes: normalized.taxes,
      markup: normalized.markup,
      fees: normalized.fees,
      discount: normalized.discount,
      totalPrice: normalized.totalPrice,
      sortOrder: normalized.sortOrder,
      createdAt: new Date().toISOString()
    };
    memory.packages[idx] = {
      ...memory.packages[idx],
      items: [...memory.packages[idx].items, item]
    };
    await appendTravelAuditLogService(actorId, "package_item_added", "travel_package", packageId, {
      title: item.title
    });
    return item;
  }

  const supabase = getSupabaseAdminClient();
  const inserted = await supabase
    .from("app_travel_package_items")
    .insert({
      package_id: packageId,
      item_type: normalized.itemType,
      source_quote_item_id: normalized.sourceQuoteItemId ?? null,
      title: normalized.title,
      summary_json: normalized.summary,
      raw_json: normalized.raw,
      base_price: normalized.basePrice,
      taxes: normalized.taxes,
      markup: normalized.markup,
      fees: normalized.fees,
      discount: normalized.discount,
      total_price: normalized.totalPrice,
      sort_order: normalized.sortOrder
    })
    .select("*")
    .single<TravelPackageItemRow>();

  if (inserted.error || !inserted.data) {
    throw new Error(`No se pudo agregar item al paquete: ${inserted.error?.message ?? "sin datos"}`);
  }

  await appendTravelAuditLogService(actorId, "package_item_added", "travel_package", packageId, {
    title: normalized.title
  });

  return mapPackageItem(inserted.data);
}

export async function attachOfferToPackageService(input: {
  packageId?: string;
  createPackageName?: string;
  destination?: string;
  offerType: "flight" | "hotel";
  offer: NormalizedFlightOffer | NormalizedHotelOffer;
  actorId?: string;
}) {
  let targetPackageId = input.packageId;

  if (!targetPackageId) {
    if (!input.createPackageName?.trim()) {
      throw new Error("Debes elegir paquete o crear uno nuevo.");
    }

    const created = await createTravelPackageService(
      {
        packageName: input.createPackageName.trim(),
        destination: input.destination?.trim() || "Destino por definir",
        status: "internal",
        visibility: "internal"
      },
      input.actorId
    );
    targetPackageId = created.id;
  }

  if (!targetPackageId) {
    throw new Error("No se pudo resolver paquete de destino.");
  }

  if (input.offerType === "flight") {
    const flight = input.offer as NormalizedFlightOffer;
    return addTravelPackageItemService(
      targetPackageId,
      {
        itemType: "flight",
        title: `${flight.airline} ${flight.flightNumber} ${flight.originAirport}-${flight.destinationAirport}`,
        summary: {
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          route: `${flight.originAirport}-${flight.destinationAirport}`,
          departureAt: flight.departureAt,
          arrivalAt: flight.arrivalAt,
          stops: flight.stops,
          baggage: flight.baggage ?? ""
        },
        raw: safeRecord(flight.raw),
        basePrice: flight.basePrice,
        taxes: flight.taxes
      },
      input.actorId
    );
  }

  const hotel = input.offer as NormalizedHotelOffer;
  return addTravelPackageItemService(
    targetPackageId,
    {
      itemType: "hotel",
      title: hotel.hotelName,
      summary: {
        hotelName: hotel.hotelName,
        address: hotel.address,
        stars: hotel.stars,
        roomType: hotel.roomType,
        mealPlan: hotel.mealPlan ?? "",
        cancellationPolicy: hotel.cancellationPolicy ?? ""
      },
      raw: safeRecord(hotel.raw),
      basePrice: hotel.totalPrice - hotel.taxes,
      taxes: hotel.taxes
    },
    input.actorId
  );
}

export async function listTravelPdfExportsService(limit = 100) {
  if (!hasSupabaseConfig()) {
    return memory.exports.slice(0, limit);
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_pdf_exports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TravelPdfExportRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar exports PDF: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapPdfExport);
}

export async function getTravelPdfExportByIdService(exportId: string) {
  if (!hasSupabaseConfig()) {
    return memory.exports.find((item) => item.id === exportId) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_pdf_exports")
    .select("*")
    .eq("id", exportId)
    .maybeSingle<TravelPdfExportRow>();

  if (result.error) {
    throw new Error(`No se pudo cargar export PDF: ${result.error.message}`);
  }

  return result.data ? mapPdfExport(result.data) : null;
}

export async function createTravelPdfExportRecordService(input: {
  relatedType: "quote" | "package" | "summary";
  relatedId: string;
  filePath: string;
  fileName: string;
  status: "generated" | "failed";
  errorMessage?: string;
  actorId?: string;
}) {
  if (!hasSupabaseConfig()) {
    const record: TravelPdfExport = {
      id: randomUUID(),
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      filePath: input.filePath,
      fileName: input.fileName,
      status: input.status,
      errorMessage: input.errorMessage,
      generatedBy: input.actorId,
      createdAt: new Date().toISOString()
    };
    memory.exports.unshift(record);
    return record;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_pdf_exports")
    .insert({
      related_type: input.relatedType,
      related_id: input.relatedId,
      file_path: input.filePath,
      file_name: input.fileName,
      status: input.status,
      error_message: input.errorMessage ?? null,
      generated_by: input.actorId ?? null
    })
    .select("*")
    .single<TravelPdfExportRow>();

  if (result.error || !result.data) {
    throw new Error(`No se pudo guardar registro PDF: ${result.error?.message ?? "sin datos"}`);
  }

  await appendTravelAuditLogService(input.actorId, "pdf_generated", "travel_pdf_export", result.data.id, {
    relatedType: input.relatedType,
    relatedId: input.relatedId
  });

  return mapPdfExport(result.data);
}

export async function listTravelAuditLogsService(limit = 100) {
  if (!hasSupabaseConfig()) {
    return memory.audit.slice(0, limit);
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_travel_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TravelAuditLogRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar logs de Travel Desk: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapAudit);
}

export async function getTravelDashboardSnapshotService(): Promise<TravelDashboardSnapshot> {
  if (!hasSupabaseConfig()) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return {
      searches24h: memory.searches.filter((item) => new Date(item.createdAt).getTime() >= since).length,
      draftQuotes: memory.quotes.filter((item) => item.status === "draft").length,
      activeQuotes: memory.quotes.filter((item) => item.status === "sent" || item.status === "approved").length,
      packagesReady: memory.packages.filter((item) => item.status === "ready").length,
      exportsCount: memory.exports.length
    };
  }

  const supabase = getSupabaseAdminClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [searches, draftQuotes, activeQuotes, readyPackages, exports] = await Promise.all([
    supabase
      .from("app_travel_search_sessions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso),
    supabase
      .from("app_travel_quotes")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("app_travel_quotes")
      .select("id", { count: "exact", head: true })
      .in("status", ["sent", "approved"]),
    supabase
      .from("app_travel_packages")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready"),
    supabase
      .from("app_travel_pdf_exports")
      .select("id", { count: "exact", head: true })
  ]);

  return {
    searches24h: searches.count ?? 0,
    draftQuotes: draftQuotes.count ?? 0,
    activeQuotes: activeQuotes.count ?? 0,
    packagesReady: readyPackages.count ?? 0,
    exportsCount: exports.count ?? 0
  };
}
