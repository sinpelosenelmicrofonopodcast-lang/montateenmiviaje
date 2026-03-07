import { createHash, randomUUID } from "node:crypto";
import { hasSupabaseConfig, getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  Customer,
  RaffleFaqItem,
  PublicRaffleParticipant,
  Raffle,
  RaffleDrawAlgorithm,
  RaffleEntry,
  RaffleEntrySource,
  RaffleEntryStatus,
  RaffleManualPaymentMethod,
  RaffleNumber,
  RaffleNumberGridMode,
  RaffleNumberStatus,
  RafflePaymentMethodConfig,
  RafflePaymentLink,
  RafflePayment,
  RaffleParticipantsMode,
  RaffleVerificationMode
} from "@/lib/types";

const MANUAL_PAYMENT_METHODS: RaffleManualPaymentMethod[] = ["paypal", "zelle", "cashapp", "ath_movil", "cash", "venmo", "other"];

export interface RegisterCustomerInput {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  referralCode?: string;
  registrationSource?: string;
  authUserId?: string;
}

export interface CreateRaffleInput {
  title: string;
  description: string;
  rulesText?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  isFree: boolean;
  entryFee: number;
  paymentInstructions: string;
  requirements: string;
  prize: string;
  startDate: string;
  endDate: string;
  drawAt: string;
  numberPoolSize: number;
  status: Raffle["status"];
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
  publicParticipantsEnabled?: boolean;
  publicParticipantsMode?: RaffleParticipantsMode;
  publicNumbersVisibility?: boolean;
  publicNumberGridMode?: RaffleNumberGridMode;
  publicWinnerName?: boolean;
  verificationMode?: RaffleVerificationMode;
  publicSeed?: string;
  publicSubtitle?: string;
  publicCtaLabel?: string;
  promoBadges?: string[];
  faqItems?: RaffleFaqItem[];
  prizeIncludes?: string[];
  howToJoinItems?: string[];
  paymentMethods?: RafflePaymentMethodConfig[];
  referralEnabled?: boolean;
  viralCounterEnabled?: boolean;
  urgencyMessage?: string;
  publicActivityEnabled?: boolean;
  liveDrawEnabled?: boolean;
  paymentLinks?: RafflePaymentLink[];
  paymentLinksNote?: string;
}

export interface DrawRaffleWinnerResult {
  raffle: Raffle;
  winnerEntry: RaffleEntry | null;
}

export interface BulkRaffleNumberMutationInput {
  raffleId: string;
  numbers: number[];
  action: "block" | "unblock" | "reserve" | "mark_sold" | "cancel";
  note?: string;
  blockedReason?: string;
  paymentMethod?: RaffleManualPaymentMethod;
  actorId?: string;
}

export interface RegisterOfflineRaffleSaleInput {
  raffleId: string;
  fullName: string;
  email: string;
  phone?: string;
  quantity?: number;
  numbers?: number[];
  randomAssignment?: boolean;
  paymentMethod: RaffleManualPaymentMethod;
  amount?: number;
  paymentReference?: string;
  note?: string;
  markAsConfirmed?: boolean;
  actorId?: string;
}

export interface RaffleAdminSnapshot {
  raffle: Raffle;
  metrics: {
    totalNumbers: number;
    available: number;
    blocked: number;
    reserved: number;
    pendingManualReview: number;
    sold: number;
    cancelled: number;
    winners: number;
    confirmedEntries: number;
    pendingEntries: number;
    rejectedEntries: number;
    offlineEntries: number;
    conversionsFromReferral: number;
  };
  numbers: RaffleNumber[];
  entries: RaffleEntry[];
  payments: RafflePayment[];
  logs: RaffleAdminLog[];
  referrals: RaffleReferralLeaderboardItem[];
}

export interface RafflePublicSummary {
  raffle: Raffle;
  metrics: {
    totalNumbers: number;
    soldNumbers: number;
    availableNumbers: number;
    blockedNumbers: number;
    reservedNumbers: number;
    progressPercent: number;
    confirmedEntries: number;
    countdownTo: string;
  };
  publicGridMode: RaffleNumberGridMode;
  publicNumbersVisibility: boolean;
  numbers: Array<{ number: number; status: RaffleNumberStatus }>;
}

export interface RaffleVerificationPayload {
  raffleId: string;
  algorithm: RaffleDrawAlgorithm;
  verificationMode: RaffleVerificationMode;
  drawAt: string;
  drawnAt?: string;
  publicSeed?: string;
  commitHash?: string;
  revealSecret?: string;
  eligibleNumbers: number[];
  hashInput?: string;
  drawHash?: string;
  winnerNumber?: number;
  winnerEntryId?: string;
}

export interface RaffleAdminLog {
  id: string;
  raffleId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadataJson: Record<string, unknown>;
  createdAt: string;
}

export interface RaffleReferralLeaderboardItem {
  referralCode: string;
  clicks: number;
  conversions: number;
}

interface AppCustomerRow {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  is_registered: boolean;
  phone: string | null;
  created_at: string;
}

interface AppRaffleRow {
  id: string;
  title: string;
  description: string;
  rules_text: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  is_free: boolean;
  entry_fee: number;
  payment_instructions: string;
  requirements: string;
  prize: string;
  start_date: string;
  end_date: string;
  draw_at: string;
  number_pool_size: number;
  winner_entry_id: string | null;
  winner_number: number | null;
  winner_customer_email: string | null;
  drawn_at: string | null;
  status: Raffle["status"];
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  public_participants_enabled?: boolean | null;
  public_participants_mode?: RaffleParticipantsMode | null;
  public_numbers_visibility?: boolean | null;
  public_number_grid_mode?: RaffleNumberGridMode | null;
  public_winner_name?: boolean | null;
  verification_mode?: RaffleVerificationMode | null;
  public_seed?: string | null;
  secret_commit_hash?: string | null;
  draw_algorithm?: RaffleDrawAlgorithm | null;
  draw_payload_json?: Record<string, unknown> | null;
  referral_enabled?: boolean | null;
  viral_counter_enabled?: boolean | null;
  urgency_message?: string | null;
  public_activity_enabled?: boolean | null;
  live_draw_enabled?: boolean | null;
  updated_at?: string | null;
  created_at: string;
}

interface AppRaffleEntryRow {
  id: string;
  raffle_id: string;
  customer_id: string;
  customer_email: string;
  chosen_number: number;
  payment_reference: string | null;
  note: string | null;
  status: RaffleEntryStatus;
  source?: RaffleEntrySource | null;
  public_display_name?: string | null;
  consent_public_listing?: boolean | null;
  payment_method?: string | null;
  payment_screenshot_url?: string | null;
  phone?: string | null;
  referral_code?: string | null;
  referred_by_code?: string | null;
  updated_at?: string | null;
  created_at: string;
}

interface AppRaffleNumberRow {
  id: string;
  raffle_id: string;
  number_value: number;
  status: RaffleNumberStatus;
  entry_id: string | null;
  customer_id: string | null;
  customer_email: string | null;
  source: RaffleEntrySource;
  assigned_offline: boolean;
  payment_method: string | null;
  admin_note: string | null;
  blocked_reason: string | null;
  blocked_by: string | null;
  blocked_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AppRafflePaymentRow {
  id: string;
  raffle_id: string;
  entry_id: string | null;
  customer_id: string | null;
  customer_email: string | null;
  amount: number;
  currency: string;
  payment_method: RaffleManualPaymentMethod;
  payment_reference: string | null;
  screenshot_url: string | null;
  is_manual: boolean;
  manually_verified: boolean;
  status: "pending" | "approved" | "rejected" | "cancelled";
  admin_note: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AppRaffleAdminLogRow {
  id: string;
  raffle_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

function mapCustomer(row: AppCustomerRow): Customer {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    fullName: row.full_name,
    email: row.email,
    isRegistered: row.is_registered,
    phone: row.phone ?? undefined,
    preferences: [],
    notes: ["Registro Supabase"],
    pipelineStage: "lead",
    tags: ["registered"]
  };
}

function mapRaffle(row: AppRaffleRow): Raffle {
  const drawPayload = row.draw_payload_json ?? {};
  const paymentLinksData = parseRafflePaymentLinksFromPayload(drawPayload);
  const contentConfig = parseRaffleContentConfig(drawPayload);
  const paymentMethods = parseRafflePaymentMethodsFromPayload(drawPayload, row.payment_instructions);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    rulesText: row.rules_text ?? undefined,
    imageUrl: row.image_url ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    ctaHref: row.cta_href ?? undefined,
    isFree: row.is_free,
    entryFee: Number(row.entry_fee),
    paymentInstructions: row.payment_instructions,
    requirements: row.requirements,
    prize: row.prize,
    startDate: row.start_date,
    endDate: row.end_date,
    drawAt: row.draw_at,
    numberPoolSize: row.number_pool_size,
    winnerEntryId: row.winner_entry_id ?? undefined,
    winnerNumber: row.winner_number ?? undefined,
    winnerCustomerEmail: row.winner_customer_email ?? undefined,
    drawnAt: row.drawn_at ?? undefined,
    status: row.status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoOgImage: row.seo_og_image ?? undefined,
    publicParticipantsEnabled: row.public_participants_enabled ?? false,
    publicParticipantsMode: row.public_participants_mode ?? "masked",
    publicNumbersVisibility: row.public_numbers_visibility ?? true,
    publicNumberGridMode: row.public_number_grid_mode ?? "full",
    publicWinnerName: row.public_winner_name ?? false,
    verificationMode: row.verification_mode ?? "commit_reveal",
    publicSeed: row.public_seed ?? undefined,
    secretCommitHash: row.secret_commit_hash ?? undefined,
    drawAlgorithm: row.draw_algorithm ?? "sha256-modulo-v1",
    drawPayloadJson: drawPayload,
    publicSubtitle: contentConfig.publicSubtitle,
    publicCtaLabel: contentConfig.publicCtaLabel,
    promoBadges: contentConfig.promoBadges,
    faqItems: contentConfig.faqItems,
    prizeIncludes: contentConfig.prizeIncludes,
    howToJoinItems: contentConfig.howToJoinItems,
    paymentMethods,
    referralEnabled: row.referral_enabled ?? true,
    viralCounterEnabled: row.viral_counter_enabled ?? true,
    urgencyMessage: row.urgency_message ?? undefined,
    publicActivityEnabled: row.public_activity_enabled ?? true,
    liveDrawEnabled: row.live_draw_enabled ?? true,
    paymentLinks: paymentLinksData.paymentLinks.length > 0 ? paymentLinksData.paymentLinks : paymentMethodsToLinks(paymentMethods),
    paymentLinksNote: paymentLinksData.paymentLinksNote,
    updatedAt: row.updated_at ?? undefined,
    createdAt: row.created_at
  };
}

function mapRaffleEntry(row: AppRaffleEntryRow): RaffleEntry {
  return {
    id: row.id,
    raffleId: row.raffle_id,
    customerId: row.customer_id,
    customerEmail: row.customer_email,
    chosenNumber: row.chosen_number,
    paymentReference: row.payment_reference ?? undefined,
    note: row.note ?? undefined,
    status: row.status,
    source: row.source ?? "online",
    publicDisplayName: row.public_display_name ?? undefined,
    consentPublicListing: row.consent_public_listing ?? false,
    paymentMethod: row.payment_method ?? undefined,
    paymentScreenshotUrl: row.payment_screenshot_url ?? undefined,
    phone: row.phone ?? undefined,
    referralCode: row.referral_code ?? undefined,
    referredByCode: row.referred_by_code ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    createdAt: row.created_at
  };
}

function mapRaffleNumber(row: AppRaffleNumberRow): RaffleNumber {
  return {
    id: row.id,
    raffleId: row.raffle_id,
    numberValue: row.number_value,
    status: row.status,
    entryId: row.entry_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    source: row.source,
    assignedOffline: row.assigned_offline,
    paymentMethod: row.payment_method ?? undefined,
    adminNote: row.admin_note ?? undefined,
    blockedReason: row.blocked_reason ?? undefined,
    blockedBy: row.blocked_by ?? undefined,
    blockedAt: row.blocked_at ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRafflePayment(row: AppRafflePaymentRow): RafflePayment {
  return {
    id: row.id,
    raffleId: row.raffle_id,
    entryId: row.entry_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    amount: Number(row.amount),
    currency: row.currency,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference ?? undefined,
    screenshotUrl: row.screenshot_url ?? undefined,
    isManual: row.is_manual,
    manuallyVerified: row.manually_verified,
    status: row.status,
    adminNote: row.admin_note ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRaffleAdminLog(row: AppRaffleAdminLogRow): RaffleAdminLog {
  return {
    id: row.id,
    raffleId: row.raffle_id ?? undefined,
    actorId: row.actor_id ?? undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    metadataJson: row.metadata_json ?? {},
    createdAt: row.created_at
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizePhone(value?: string) {
  if (!value) return undefined;
  const v = value.trim();
  return v.length > 0 ? v : undefined;
}

function ensureConfigured() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase no está configurado");
  }
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const pgError = error as { code?: string };
  return pgError.code === "23505";
}

function mapEntryStatusToNumberStatus(status: RaffleEntryStatus): RaffleNumberStatus {
  if (status === "confirmed") return "sold";
  if (status === "pending_review") return "pending_manual_review";
  if (status === "pending_payment") return "reserved";
  return "cancelled";
}

function isPendingEntryStatus(status: RaffleEntryStatus) {
  return status === "pending_payment" || status === "pending_review";
}

function ensurePaymentMethod(method: string | undefined): RaffleManualPaymentMethod {
  if (method && MANUAL_PAYMENT_METHODS.includes(method as RaffleManualPaymentMethod)) {
    return method as RaffleManualPaymentMethod;
  }
  return "other";
}

function normalizePaymentHref(value: string) {
  const href = value.trim();
  if (!href) return "";
  if (href.startsWith("paypal.me/")) return `https://${href}`;
  if (href.startsWith("cash.app/")) return `https://${href}`;
  if (href.startsWith("$")) return `https://cash.app/${href}`;
  if (href.startsWith("www.")) return `https://${href}`;
  return href;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function sanitizeStringList(value: unknown) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => asNonEmptyString(item))
    .filter(Boolean);
}

function sanitizeFaqItems(value: unknown): RaffleFaqItem[] {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const question = asNonEmptyString(item.question);
      const answer = asNonEmptyString(item.answer);
      if (!question || !answer) return null;
      return { question, answer } as RaffleFaqItem;
    })
    .filter((item): item is RaffleFaqItem => Boolean(item));
}

function methodHrefFromProvider(provider: string, href: string, destination: string) {
  if (href) {
    return normalizePaymentHref(href);
  }

  if (!destination) {
    return "";
  }

  if (provider === "paypal") {
    const paypalHref = destination.includes("/") ? destination : `paypal.me/${destination.replace(/^@/, "")}`;
    return normalizePaymentHref(paypalHref);
  }

  if (provider === "cashapp") {
    const cashTag = destination.startsWith("$") ? destination : `$${destination.replace(/^@/, "")}`;
    return normalizePaymentHref(cashTag);
  }

  if (provider === "zelle" && destination.includes("@")) {
    return `mailto:${destination}`;
  }

  return "";
}

function sanitizeRafflePaymentMethods(value: unknown): RafflePaymentMethodConfig[] {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item, index) => {
      const provider = asNonEmptyString(item.provider || item.key).toLowerCase();
      const label = asNonEmptyString(item.label) || provider;
      const destinationValue = asNonEmptyString(item.destinationValue ?? item.destination_value);
      const href = methodHrefFromProvider(provider, asNonEmptyString(item.href), destinationValue);
      const instructions = asNonEmptyString(item.instructions);
      const displayOrder = Number.isFinite(Number(item.displayOrder ?? item.display_order))
        ? Number(item.displayOrder ?? item.display_order)
        : index;
      const enabled = typeof item.enabled === "boolean" ? item.enabled : true;
      const requiresReference = typeof item.requiresReference === "boolean"
        ? item.requiresReference
        : typeof item.requires_reference === "boolean"
          ? Boolean(item.requires_reference)
          : false;
      const requiresScreenshot = typeof item.requiresScreenshot === "boolean"
        ? item.requiresScreenshot
        : typeof item.requires_screenshot === "boolean"
          ? Boolean(item.requires_screenshot)
          : false;
      const isAutomatic = typeof item.isAutomatic === "boolean"
        ? item.isAutomatic
        : typeof item.is_automatic === "boolean"
          ? Boolean(item.is_automatic)
          : provider === "stripe";
      const config =
        item.config && typeof item.config === "object"
          ? (item.config as Record<string, unknown>)
          : undefined;

      if (!provider || !label) {
        return null;
      }

      return {
        provider,
        enabled,
        label,
        instructions: instructions || undefined,
        destinationValue: destinationValue || undefined,
        href: href || undefined,
        displayOrder,
        requiresReference,
        requiresScreenshot,
        isAutomatic,
        config
      } as RafflePaymentMethodConfig;
    })
    .filter((item): item is RafflePaymentMethodConfig => Boolean(item))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function paymentMethodsToLinks(methods: RafflePaymentMethodConfig[]): RafflePaymentLink[] {
  return methods
    .filter((method) => method.enabled && method.href)
    .map((method) => ({
      key: method.provider,
      label: method.label,
      href: method.href!,
      active: true
    }));
}

function sanitizeRafflePaymentLinks(value: unknown): RafflePaymentLink[] {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const key = typeof item.key === "string" ? item.key.trim().toLowerCase() : "";
      const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : key;
      const hrefRaw =
        typeof item.href === "string" ? item.href : typeof item.url === "string" ? item.url : "";
      const href = normalizePaymentHref(hrefRaw);
      const active = typeof item.active === "boolean" ? item.active : true;

      if (!key || !label || !href || !active) {
        return null;
      }

      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) {
        return null;
      }

      return { key, label, href, active } as RafflePaymentLink;
    })
    .filter((item): item is RafflePaymentLink => Boolean(item));
}

function parseRafflePaymentLinksFromPayload(payload: Record<string, unknown> | null | undefined) {
  const paymentLinks = sanitizeRafflePaymentLinks(payload?.payment_links);
  const paymentLinksNote =
    typeof payload?.payment_links_note === "string" && payload.payment_links_note.trim()
      ? payload.payment_links_note.trim()
      : undefined;

  return { paymentLinks, paymentLinksNote };
}

function parseRafflePaymentMethodsFromPayload(
  payload: Record<string, unknown> | null | undefined,
  paymentInstructions: string
) {
  const methodsFromPayload = sanitizeRafflePaymentMethods(payload?.payment_methods);
  if (methodsFromPayload.length > 0) {
    return methodsFromPayload;
  }

  const links = sanitizeRafflePaymentLinks(payload?.payment_links);
  return links.map((item, index) => ({
    provider: item.key,
    enabled: item.active,
    label: item.label,
    href: item.href,
    instructions: paymentInstructions || undefined,
    destinationValue: undefined,
    displayOrder: index,
    requiresReference: false,
    requiresScreenshot: false,
    isAutomatic: item.key === "stripe",
    config: undefined
  }));
}

function parseRaffleContentConfig(payload: Record<string, unknown> | null | undefined) {
  return {
    publicSubtitle: asNonEmptyString(payload?.public_subtitle) || undefined,
    publicCtaLabel: asNonEmptyString(payload?.public_cta_label) || undefined,
    promoBadges: sanitizeStringList(payload?.promo_badges),
    faqItems: sanitizeFaqItems(payload?.faq_items),
    prizeIncludes: sanitizeStringList(payload?.prize_includes),
    howToJoinItems: sanitizeStringList(payload?.how_to_join_items)
  };
}

function toReferralCode(email: string) {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "REF";
  return `${base.slice(0, 6)}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function hashSha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function toPublicDisplayName(entry: RaffleEntry, mode: RaffleParticipantsMode) {
  const source = entry.publicDisplayName || entry.customerEmail;
  const [first = "Participante", second = ""] = source.split(" ");
  const masked = second
    ? `${first.slice(0, 3)}${"*".repeat(Math.max(first.length - 3, 1))} ${second.slice(0, 3)}${"*".repeat(Math.max(second.length - 3, 1))}`
    : `${first.slice(0, 2)}${"*".repeat(Math.max(first.length - 2, 1))}`;

  if (mode === "name_only") {
    return source;
  }
  if (mode === "masked") {
    return masked;
  }
  if (mode === "name_number") {
    return source;
  }
  return "Participante";
}

async function syncProfileFromRegistration(input: { authUserId: string; email: string; phone?: string }) {
  const supabase = getSupabaseAdminClient();
  const basePayload = {
    id: input.authUserId,
    email: normalizeEmail(input.email),
    role: "user"
  };

  const withPhone = await supabase.from("profiles").upsert(
    {
      ...basePayload,
      phone: input.phone?.trim() || null
    },
    { onConflict: "id" }
  );

  if (!withPhone.error) {
    return;
  }

  if (withPhone.error.code === "42703" || /column .*phone/i.test(withPhone.error.message)) {
    const fallback = await supabase.from("profiles").upsert(basePayload, { onConflict: "id" });
    if (!fallback.error) {
      return;
    }
    throw new Error(`No se pudo sincronizar perfil: ${fallback.error.message}`);
  }

  throw new Error(`No se pudo sincronizar perfil: ${withPhone.error.message}`);
}

async function getRaffleRowOrThrow(raffleId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_raffles")
    .select("*")
    .eq("id", raffleId)
    .maybeSingle<AppRaffleRow>();

  if (error) {
    throw new Error(`Error consultando sorteo: ${error.message}`);
  }

  if (!data) {
    throw new Error("Sorteo no encontrado");
  }

  return data;
}

async function getEntryById(entryId: string) {
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_raffle_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle<AppRaffleEntryRow>();

  if (result.error) {
    throw new Error(`Error consultando participación: ${result.error.message}`);
  }

  return result.data ?? null;
}

async function ensureRaffleNumbersSeeded(raffleId: string, numberPoolSize: number) {
  const supabase = getSupabaseAdminClient();
  const payload = Array.from({ length: numberPoolSize }, (_, index) => ({
    raffle_id: raffleId,
    number_value: index + 1,
    status: "available" as RaffleNumberStatus,
    source: "online" as RaffleEntrySource,
    assigned_offline: false
  }));

  const result = await supabase
    .from("app_raffle_numbers")
    .upsert(payload, { onConflict: "raffle_id,number_value", ignoreDuplicates: true });

  if (result.error) {
    throw new Error(`No se pudo inicializar el pool de números: ${result.error.message}`);
  }
}

async function logRaffleAdminAction(input: {
  raffleId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.from("app_raffle_admin_logs").insert({
    raffle_id: input.raffleId ?? null,
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ?? {}
  });

  if (result.error) {
    throw new Error(`No se pudo guardar auditoría: ${result.error.message}`);
  }
}

async function syncNumberForEntry(entry: AppRaffleEntryRow, options?: { actorId?: string; paymentMethod?: string }) {
  const supabase = getSupabaseAdminClient();
  const mappedStatus = mapEntryStatusToNumberStatus(entry.status);

  const update = await supabase
    .from("app_raffle_numbers")
    .update({
      status: mappedStatus,
      entry_id: entry.id,
      customer_id: entry.customer_id,
      customer_email: entry.customer_email,
      source: entry.source ?? "online",
      assigned_offline: (entry.source ?? "online") !== "online",
      payment_method: options?.paymentMethod ?? entry.payment_method ?? null,
      updated_by: options?.actorId ?? null,
      updated_at: new Date().toISOString(),
      blocked_reason: mappedStatus === "blocked" ? "manual" : null,
      blocked_at: mappedStatus === "blocked" ? new Date().toISOString() : null
    })
    .eq("raffle_id", entry.raffle_id)
    .eq("number_value", entry.chosen_number);

  if (update.error) {
    throw new Error(`No se pudo sincronizar número ${entry.chosen_number}: ${update.error.message}`);
  }
}

async function syncAllNumbersFromEntries(raffleId: string) {
  const entries = await listRaffleEntriesRows(raffleId);
  for (const entry of entries) {
    if (entry.status === "rejected") {
      continue;
    }
    await syncNumberForEntry(entry);
  }
}

async function listRaffleEntriesRows(raffleId?: string) {
  const supabase = getSupabaseAdminClient();
  const query = supabase
    .from("app_raffle_entries")
    .select("*")
    .order("created_at", { ascending: false });

  const response = raffleId
    ? await query.eq("raffle_id", raffleId).returns<AppRaffleEntryRow[]>()
    : await query.returns<AppRaffleEntryRow[]>();

  if (response.error) {
    throw new Error(`No se pudieron cargar participaciones: ${response.error.message}`);
  }

  return response.data ?? [];
}

async function drawRaffleWinnerSupabase(
  raffleId: string,
  options?: { force?: boolean; actorId?: string }
): Promise<DrawRaffleWinnerResult> {
  const supabase = getSupabaseAdminClient();
  const raffle = await getRaffleRowOrThrow(raffleId);

  if (raffle.status === "draft") {
    throw new Error("El sorteo aún no está publicado");
  }

  if (raffle.drawn_at) {
    if (!raffle.winner_entry_id) {
      return { raffle: mapRaffle(raffle), winnerEntry: null };
    }

    const winner = await supabase
      .from("app_raffle_entries")
      .select("*")
      .eq("id", raffle.winner_entry_id)
      .maybeSingle<AppRaffleEntryRow>();

    if (winner.error) {
      throw new Error(`Error consultando ganador: ${winner.error.message}`);
    }

    return {
      raffle: mapRaffle(raffle),
      winnerEntry: winner.data ? mapRaffleEntry(winner.data) : null
    };
  }

  const now = new Date();
  if (!options?.force && now.getTime() < new Date(raffle.draw_at).getTime()) {
    throw new Error("Aún no llega la hora del sorteo");
  }

  await ensureRaffleNumbersSeeded(raffle.id, raffle.number_pool_size);
  await syncAllNumbersFromEntries(raffleId);

  const numberRowsResult = await supabase
    .from("app_raffle_numbers")
    .select("*")
    .eq("raffle_id", raffleId)
    .in("status", ["sold", "winner"])
    .order("number_value", { ascending: true })
    .returns<AppRaffleNumberRow[]>();

  if (numberRowsResult.error) {
    throw new Error(`No se pudieron cargar números elegibles: ${numberRowsResult.error.message}`);
  }

  const eligibleNumbers = (numberRowsResult.data ?? []).map((row) => row.number_value);

  let winnerEntry: AppRaffleEntryRow | null = null;
  let winnerNumber: number | null = null;
  let drawPayloadJson: Record<string, unknown> = { ...(raffle.draw_payload_json ?? {}) };

  if (eligibleNumbers.length > 0) {
    const previousPayload = raffle.draw_payload_json ?? {};
    const publicSeed = raffle.public_seed ?? String(previousPayload.public_seed ?? randomUUID().replace(/-/g, "").slice(0, 24));
    const revealSecret = String(previousPayload.reveal_secret ?? randomUUID().replace(/-/g, "").slice(0, 32));
    const commitHash = hashSha256(`${publicSeed}:${revealSecret}`);
    const drawTimestamp = now.toISOString();
    const hashInput = `${publicSeed}|${revealSecret}|${drawTimestamp}|${eligibleNumbers.join(",")}`;
    const drawHash = hashSha256(hashInput);
    const winnerIndex = Number(BigInt(`0x${drawHash.slice(0, 15)}`) % BigInt(eligibleNumbers.length));

    winnerNumber = eligibleNumbers[winnerIndex] ?? null;

    if (winnerNumber !== null) {
      const winnerLookup = await supabase
        .from("app_raffle_numbers")
        .select("entry_id")
        .eq("raffle_id", raffleId)
        .eq("number_value", winnerNumber)
        .maybeSingle<{ entry_id: string | null }>();

      if (winnerLookup.error) {
        throw new Error(`No se pudo resolver entrada ganadora: ${winnerLookup.error.message}`);
      }

      if (winnerLookup.data?.entry_id) {
        const entry = await getEntryById(winnerLookup.data.entry_id);
        winnerEntry = entry;
      }
    }

    drawPayloadJson = {
      ...previousPayload,
      verification_mode: raffle.verification_mode ?? "commit_reveal",
      algorithm: raffle.draw_algorithm ?? "sha256-modulo-v1",
      public_seed: publicSeed,
      reveal_secret: revealSecret,
      commit_hash: commitHash,
      draw_timestamp: drawTimestamp,
      eligible_numbers: eligibleNumbers,
      hash_input: hashInput,
      draw_hash: drawHash,
      winner_index: winnerIndex,
      winner_number: winnerNumber,
      winner_entry_id: winnerEntry?.id ?? null
    };

    const resetWinner = await supabase
      .from("app_raffle_numbers")
      .update({ status: "sold", updated_at: drawTimestamp })
      .eq("raffle_id", raffleId)
      .eq("status", "winner");

    if (resetWinner.error) {
      throw new Error(`No se pudo resetear estado de ganador anterior: ${resetWinner.error.message}`);
    }

    if (winnerNumber !== null) {
      const markWinner = await supabase
        .from("app_raffle_numbers")
        .update({ status: "winner", updated_at: drawTimestamp })
        .eq("raffle_id", raffleId)
        .eq("number_value", winnerNumber);

      if (markWinner.error) {
        throw new Error(`No se pudo marcar número ganador: ${markWinner.error.message}`);
      }
    }
  }

  const updatePayload = {
    status: "closed" as const,
    drawn_at: now.toISOString(),
    winner_entry_id: winnerEntry?.id ?? null,
    winner_number: winnerNumber,
    winner_customer_email: winnerEntry?.customer_email ?? null,
    public_seed: drawPayloadJson.public_seed ?? raffle.public_seed ?? null,
    secret_commit_hash: drawPayloadJson.commit_hash ?? raffle.secret_commit_hash ?? null,
    draw_payload_json: drawPayloadJson,
    updated_at: now.toISOString()
  };

  const update = await supabase
    .from("app_raffles")
    .update(updatePayload)
    .eq("id", raffleId)
    .is("drawn_at", null)
    .select("*")
    .single<AppRaffleRow>();

  if (update.error || !update.data) {
    throw new Error(`Error cerrando sorteo: ${update.error?.message ?? "sin datos"}`);
  }

  await logRaffleAdminAction({
    raffleId,
    actorId: options?.actorId,
    action: "draw_executed",
    entityType: "raffle",
    entityId: raffleId,
    metadata: {
      winnerNumber,
      winnerEntryId: winnerEntry?.id ?? null,
      eligibleNumbers: eligibleNumbers.length,
      verification: drawPayloadJson
    }
  });

  return {
    raffle: mapRaffle(update.data),
    winnerEntry: winnerEntry ? mapRaffleEntry(winnerEntry) : null
  };
}

async function runDueRaffleDrawsSupabase() {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const dueRaffles = await supabase
    .from("app_raffles")
    .select("id")
    .eq("status", "published")
    .is("drawn_at", null)
    .lte("draw_at", now)
    .returns<Array<{ id: string }>>();

  if (dueRaffles.error) {
    throw new Error(`Error verificando sorteos pendientes: ${dueRaffles.error.message}`);
  }

  for (const raffle of dueRaffles.data ?? []) {
    await drawRaffleWinnerSupabase(raffle.id, { force: true });
  }
}

export async function registerCustomerService(input: RegisterCustomerInput) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const fullName = input.fullName?.trim() || `${input.firstName?.trim() ?? ""} ${input.lastName?.trim() ?? ""}`.trim();
  const payload: Record<string, unknown> = {
    full_name: normalizeName(fullName || normalizeEmail(input.email)),
    email: normalizeEmail(input.email),
    phone: input.phone?.trim() || null,
    country: input.country?.trim() || null,
    is_registered: true
  };
  if (input.authUserId) {
    payload.auth_user_id = input.authUserId;
  }

  const { data, error } = await supabase
    .from("app_customers")
    .upsert(payload, { onConflict: "email" })
    .select("*")
    .single<AppCustomerRow>();

  if (error || !data) {
    throw new Error(`No se pudo registrar usuario: ${error?.message ?? "sin datos"}`);
  }

  if (input.authUserId) {
    await syncProfileFromRegistration({
      authUserId: input.authUserId,
      email: input.email,
      phone: input.phone
    });
  }

  return mapCustomer(data);
}

export async function listRafflesService(options?: { includeDrafts?: boolean; includeClosed?: boolean }) {
  ensureConfigured();

  await runDueRaffleDrawsSupabase();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_raffles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<AppRaffleRow[]>();

  if (error) {
    throw new Error(`No se pudieron cargar sorteos: ${error.message}`);
  }

  const includeDrafts = options?.includeDrafts ?? false;
  const includeClosed = options?.includeClosed ?? false;
  const mapped = (data ?? []).map(mapRaffle);

  if (includeDrafts) {
    return mapped;
  }

  return mapped.filter((raffle) => raffle.status === "published" || (includeClosed && raffle.status === "closed"));
}

export async function getRaffleByIdService(raffleId: string) {
  ensureConfigured();

  await runDueRaffleDrawsSupabase();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_raffles")
    .select("*")
    .eq("id", raffleId)
    .maybeSingle<AppRaffleRow>();

  if (error) {
    throw new Error(`No se pudo cargar el sorteo: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRaffle(data);
}

export async function listRaffleEntriesService(raffleId?: string) {
  ensureConfigured();
  await runDueRaffleDrawsSupabase();

  return (await listRaffleEntriesRows(raffleId)).map(mapRaffleEntry);
}

export async function listRaffleNumbersService(raffleId: string, options?: {
  statuses?: RaffleNumberStatus[];
  search?: string;
  limit?: number;
}) {
  ensureConfigured();
  await runDueRaffleDrawsSupabase();

  const raffle = await getRaffleRowOrThrow(raffleId);
  await ensureRaffleNumbersSeeded(raffle.id, raffle.number_pool_size);

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_raffle_numbers")
    .select("*")
    .eq("raffle_id", raffleId)
    .order("number_value", { ascending: true });

  if (options?.statuses?.length) {
    query = query.in("status", options.statuses);
  }

  query = query.limit(options?.limit ?? raffle.number_pool_size);

  const rows = await query.returns<AppRaffleNumberRow[]>();

  if (rows.error) {
    throw new Error(`No se pudieron cargar números: ${rows.error.message}`);
  }

  let mapped = (rows.data ?? []).map(mapRaffleNumber);

  if (options?.search?.trim()) {
    const target = options.search.trim().toLowerCase();
    mapped = mapped.filter((item) => {
      const byNumber = String(item.numberValue).includes(target);
      const byEmail = item.customerEmail?.toLowerCase().includes(target) ?? false;
      const byStatus = item.status.includes(target as RaffleNumberStatus);
      return byNumber || byEmail || byStatus;
    });
  }

  return mapped;
}

export async function listAvailableRaffleNumbersService(raffleId: string) {
  ensureConfigured();

  await runDueRaffleDrawsSupabase();
  const raffle = await getRaffleRowOrThrow(raffleId);
  await ensureRaffleNumbersSeeded(raffle.id, raffle.number_pool_size);

  const supabase = getSupabaseAdminClient();
  const numbers = await supabase
    .from("app_raffle_numbers")
    .select("number_value")
    .eq("raffle_id", raffleId)
    .eq("status", "available")
    .order("number_value", { ascending: true })
    .returns<Array<{ number_value: number }>>();

  if (numbers.error) {
    throw new Error(`No se pudieron cargar números disponibles: ${numbers.error.message}`);
  }

  return (numbers.data ?? []).map((item) => item.number_value);
}

export async function createRaffleService(input: CreateRaffleInput) {
  ensureConfigured();

  const startAt = new Date(input.startDate);
  const endAt = new Date(input.endDate);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Fechas del sorteo inválidas");
  }
  if (endAt.getTime() < startAt.getTime()) {
    throw new Error("La fecha de cierre no puede ser menor que la fecha de inicio");
  }

  const drawAt = new Date(input.drawAt);
  if (Number.isNaN(drawAt.getTime())) {
    throw new Error("Fecha de anuncio inválida");
  }
  if (drawAt.getTime() < endAt.getTime()) {
    throw new Error("La fecha de anuncio debe ser igual o posterior al cierre");
  }
  if (!Number.isInteger(input.numberPoolSize) || input.numberPoolSize < 1) {
    throw new Error("La cantidad de números debe ser mayor a 0");
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const verificationMode = input.verificationMode ?? "commit_reveal";
  const publicSeed = input.publicSeed ?? randomUUID().replace(/-/g, "").slice(0, 24);
  const revealSecret = randomUUID().replace(/-/g, "").slice(0, 32);
  const secretCommitHash = hashSha256(`${publicSeed}:${revealSecret}`);
  const sanitizedPaymentMethods = sanitizeRafflePaymentMethods(input.paymentMethods);
  const normalizedPaymentLinks = sanitizeRafflePaymentLinks(input.paymentLinks);
  const paymentLinks = sanitizeRafflePaymentLinks(input.paymentLinks);
  const paymentLinksNote = typeof input.paymentLinksNote === "string" && input.paymentLinksNote.trim()
    ? input.paymentLinksNote.trim()
    : null;
  const promoBadges = sanitizeStringList(input.promoBadges);
  const faqItems = sanitizeFaqItems(input.faqItems);
  const prizeIncludes = sanitizeStringList(input.prizeIncludes);
  const howToJoinItems = sanitizeStringList(input.howToJoinItems);
  const drawPayloadJson: Record<string, unknown> =
    verificationMode === "commit_reveal"
      ? { commit_hash: secretCommitHash, reveal_secret: revealSecret, prepared_at: now, public_seed: publicSeed }
      : {};
  if (typeof input.publicSubtitle === "string" && input.publicSubtitle.trim()) {
    drawPayloadJson.public_subtitle = input.publicSubtitle.trim();
  }
  if (typeof input.publicCtaLabel === "string" && input.publicCtaLabel.trim()) {
    drawPayloadJson.public_cta_label = input.publicCtaLabel.trim();
  }
  if (promoBadges.length > 0) {
    drawPayloadJson.promo_badges = promoBadges;
  }
  if (faqItems.length > 0) {
    drawPayloadJson.faq_items = faqItems;
  }
  if (prizeIncludes.length > 0) {
    drawPayloadJson.prize_includes = prizeIncludes;
  }
  if (howToJoinItems.length > 0) {
    drawPayloadJson.how_to_join_items = howToJoinItems;
  }
  if (sanitizedPaymentMethods.length > 0) {
    drawPayloadJson.payment_methods = sanitizedPaymentMethods;
  }
  if (paymentLinks.length > 0) {
    drawPayloadJson.payment_links = paymentLinks;
  } else if (sanitizedPaymentMethods.length > 0) {
    drawPayloadJson.payment_links = paymentMethodsToLinks(sanitizedPaymentMethods);
  } else if (normalizedPaymentLinks.length > 0) {
    drawPayloadJson.payment_links = normalizedPaymentLinks;
  }
  if (paymentLinksNote) {
    drawPayloadJson.payment_links_note = paymentLinksNote;
  }

  const result = await supabase
    .from("app_raffles")
    .insert({
      title: input.title,
      description: input.description,
      rules_text: input.rulesText ?? input.requirements,
      image_url: input.imageUrl ?? null,
      cta_label: input.publicCtaLabel ?? input.ctaLabel ?? null,
      cta_href: input.ctaHref ?? null,
      is_free: input.isFree,
      entry_fee: input.isFree ? 0 : input.entryFee,
      payment_instructions: input.isFree ? "No requiere pago." : input.paymentInstructions,
      requirements: input.requirements,
      prize: input.prize,
      start_date: input.startDate,
      end_date: input.endDate,
      draw_at: drawAt.toISOString(),
      number_pool_size: input.numberPoolSize,
      status: input.status,
      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
      seo_og_image: input.seoOgImage ?? null,
      public_participants_enabled: input.publicParticipantsEnabled ?? false,
      public_participants_mode: input.publicParticipantsMode ?? "masked",
      public_numbers_visibility: input.publicNumbersVisibility ?? true,
      public_number_grid_mode: input.publicNumberGridMode ?? "full",
      public_winner_name: input.publicWinnerName ?? false,
      verification_mode: verificationMode,
      public_seed: verificationMode === "commit_reveal" ? publicSeed : null,
      secret_commit_hash: verificationMode === "commit_reveal" ? secretCommitHash : null,
      draw_algorithm: "sha256-modulo-v1",
      draw_payload_json: drawPayloadJson,
      referral_enabled: input.referralEnabled ?? true,
      viral_counter_enabled: input.viralCounterEnabled ?? true,
      urgency_message: input.urgencyMessage ?? null,
      public_activity_enabled: input.publicActivityEnabled ?? true,
      live_draw_enabled: input.liveDrawEnabled ?? true,
      updated_at: now
    })
    .select("*")
    .single<AppRaffleRow>();

  if (result.error || !result.data) {
    throw new Error(`No se pudo crear el sorteo: ${result.error?.message ?? "sin datos"}`);
  }

  await ensureRaffleNumbersSeeded(result.data.id, result.data.number_pool_size);

  await logRaffleAdminAction({
    raffleId: result.data.id,
    action: "raffle_created",
    entityType: "raffle",
    entityId: result.data.id,
    metadata: { title: result.data.title, numberPoolSize: result.data.number_pool_size }
  });

  return mapRaffle(result.data);
}

export async function enterRaffleService(
  raffleId: string,
  customerEmail: string,
  chosenNumber: number,
  note?: string,
  paymentReference?: string,
  options?: {
    referredByCode?: string;
    publicDisplayName?: string;
    consentPublicListing?: boolean;
    paymentMethod?: string;
    paymentScreenshotUrl?: string;
    phone?: string;
  }
) {
  ensureConfigured();

  await runDueRaffleDrawsSupabase();
  const raffle = await getRaffleRowOrThrow(raffleId);

  if (raffle.status !== "published") {
    throw new Error("Este sorteo no está disponible");
  }

  const now = Date.now();
  const startsAt = new Date(raffle.start_date).getTime();
  const drawAt = new Date(raffle.draw_at).getTime();

  if (!Number.isNaN(startsAt) && now < startsAt) {
    throw new Error("El sorteo aún no inicia");
  }
  if (!Number.isNaN(drawAt) && now >= drawAt) {
    throw new Error("El sorteo ya cerró participaciones");
  }
  if (!Number.isInteger(chosenNumber) || chosenNumber < 1 || chosenNumber > raffle.number_pool_size) {
    throw new Error(`El número debe estar entre 1 y ${raffle.number_pool_size}`);
  }

  await ensureRaffleNumbersSeeded(raffleId, raffle.number_pool_size);

  const supabase = getSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(customerEmail);
  const customer = await supabase
    .from("app_customers")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("is_registered", true)
    .maybeSingle<AppCustomerRow>();

  if (customer.error) {
    throw new Error(`Error validando usuario: ${customer.error.message}`);
  }
  if (!customer.data) {
    throw new Error("Debes estar registrado para participar");
  }

  const existing = await supabase
    .from("app_raffle_entries")
    .select("id")
    .eq("raffle_id", raffleId)
    .eq("customer_id", customer.data.id)
    .in("status", ["pending_payment", "pending_review", "confirmed"]) // mantiene compatibilidad
    .maybeSingle<{ id: string }>();

  if (existing.error) {
    throw new Error(`Error validando participación: ${existing.error.message}`);
  }
  if (existing.data) {
    throw new Error("Ya participas en este sorteo");
  }

  const numberRow = await supabase
    .from("app_raffle_numbers")
    .select("status")
    .eq("raffle_id", raffleId)
    .eq("number_value", chosenNumber)
    .maybeSingle<{ status: RaffleNumberStatus }>();

  if (numberRow.error) {
    throw new Error(`No se pudo validar el número: ${numberRow.error.message}`);
  }

  if (!numberRow.data || numberRow.data.status !== "available") {
    throw new Error("Ese número ya no está disponible");
  }

  const raffleModel = mapRaffle(raffle);
  const configuredMethods = (raffleModel.paymentMethods ?? []).filter((method) => method.enabled);
  const requestedPaymentMethod = options?.paymentMethod?.trim().toLowerCase();
  const selectedMethodConfig = requestedPaymentMethod
    ? configuredMethods.find((method) => method.provider === requestedPaymentMethod)
    : configuredMethods[0];

  if (!raffle.is_free && configuredMethods.length > 0 && !selectedMethodConfig) {
    throw new Error("Método de pago inválido para este sorteo");
  }

  const normalizedPaymentReference = paymentReference?.trim() || undefined;
  const normalizedScreenshotUrl = options?.paymentScreenshotUrl?.trim() || undefined;

  if (!raffle.is_free && selectedMethodConfig?.requiresReference && !normalizedPaymentReference) {
    throw new Error("Este método de pago requiere referencia.");
  }

  if (!raffle.is_free && selectedMethodConfig?.requiresScreenshot && !normalizedScreenshotUrl) {
    throw new Error("Este método de pago requiere screenshot/comprobante.");
  }

  const finalPaymentMethod = selectedMethodConfig?.provider ?? requestedPaymentMethod ?? "other";

  const status: RaffleEntryStatus = raffle.is_free
    ? "confirmed"
    : normalizedPaymentReference || normalizedScreenshotUrl
      ? "pending_review"
      : "pending_payment";

  const referralCode = toReferralCode(customer.data.email);
  const paymentMethod = finalPaymentMethod;

  const insert = await supabase
    .from("app_raffle_entries")
    .insert({
      raffle_id: raffleId,
      customer_id: customer.data.id,
      customer_email: customer.data.email,
      chosen_number: chosenNumber,
      payment_reference: normalizedPaymentReference ?? null,
      note: note ?? null,
      status,
      source: "online",
      public_display_name: options?.publicDisplayName?.trim() || null,
      consent_public_listing: options?.consentPublicListing ?? false,
      payment_method: paymentMethod ?? null,
      phone: normalizePhone(options?.phone) ?? null,
      referral_code: referralCode,
      referred_by_code: options?.referredByCode?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single<AppRaffleEntryRow>();

  if (insert.error || !insert.data) {
    if (isUniqueViolation(insert.error)) {
      throw new Error("Ese número ya fue seleccionado por otro participante");
    }

    throw new Error(`No se pudo registrar participación: ${insert.error?.message ?? "sin datos"}`);
  }

  await syncNumberForEntry(insert.data, { paymentMethod, actorId: undefined });

  if (!raffle.is_free) {
    const normalizedMethodForPayments = ensurePaymentMethod(paymentMethod);
    const paymentInsert = await supabase.from("app_raffle_payments").insert({
      raffle_id: raffle.id,
      entry_id: insert.data.id,
      customer_id: customer.data.id,
      customer_email: customer.data.email,
      amount: Number(raffle.entry_fee),
      currency: "USD",
      payment_method: normalizedMethodForPayments,
      payment_reference: normalizedPaymentReference ?? null,
      screenshot_url: normalizedScreenshotUrl ?? null,
      is_manual: selectedMethodConfig ? !selectedMethodConfig.isAutomatic : true,
      manually_verified: false,
      status: "pending",
      admin_note: selectedMethodConfig && normalizedMethodForPayments !== selectedMethodConfig.provider
        ? `provider:${selectedMethodConfig.provider}`
        : null,
      created_by: null,
      updated_at: new Date().toISOString()
    });

    if (paymentInsert.error) {
      console.error("No se pudo crear pago pendiente de rifa", paymentInsert.error.message);
    }
  }

  if (options?.referredByCode?.trim()) {
    const conversionEvent = await supabase.from("app_raffle_referral_events").insert({
      raffle_id: raffleId,
      referral_code: options.referredByCode.trim().toUpperCase(),
      event_type: "conversion",
      referred_entry_id: insert.data.id,
      metadata_json: { source: "online", converted_email: insert.data.customer_email }
    });

    if (conversionEvent.error) {
      throw new Error(`No se pudo registrar conversión de referido: ${conversionEvent.error.message}`);
    }
  }

  return mapRaffleEntry(insert.data);
}

export async function updateRaffleEntryStatusService(entryId: string, status: RaffleEntryStatus, actorId?: string) {
  ensureConfigured();

  const entry = await getEntryById(entryId);
  if (!entry) {
    return null;
  }

  const raffle = await getRaffleRowOrThrow(entry.raffle_id);
  if (raffle.drawn_at) {
    throw new Error("No se puede editar participaciones de un sorteo ya sorteado");
  }

  const supabase = getSupabaseAdminClient();

  const updated = await supabase
    .from("app_raffle_entries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select("*")
    .single<AppRaffleEntryRow>();

  if (updated.error || !updated.data) {
    if (isUniqueViolation(updated.error)) {
      throw new Error("El número ya fue reasignado a otro participante");
    }

    throw new Error(`No se pudo actualizar participación: ${updated.error?.message ?? "sin datos"}`);
  }

  await syncNumberForEntry(updated.data, { actorId });

  await logRaffleAdminAction({
    raffleId: entry.raffle_id,
    actorId,
    action: "entry_status_updated",
    entityType: "raffle_entry",
    entityId: entryId,
    metadata: { previousStatus: entry.status, nextStatus: status, chosenNumber: entry.chosen_number }
  });

  return mapRaffleEntry(updated.data);
}

export async function updateRaffleStatusService(raffleId: string, status: Raffle["status"], actorId?: string) {
  ensureConfigured();

  const raffle = await getRaffleRowOrThrow(raffleId);
  if (raffle.drawn_at && status === "published") {
    throw new Error("No se puede reabrir un sorteo ya sorteado");
  }

  const supabase = getSupabaseAdminClient();
  const updated = await supabase
    .from("app_raffles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", raffleId)
    .select("*")
    .single<AppRaffleRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar estado: ${updated.error?.message ?? "sin datos"}`);
  }

  if (status === "published") {
    await ensureRaffleNumbersSeeded(raffleId, updated.data.number_pool_size);
    await runDueRaffleDrawsSupabase();
    const current = await getRaffleRowOrThrow(raffleId);

    await logRaffleAdminAction({
      raffleId,
      actorId,
      action: "raffle_status_published",
      entityType: "raffle",
      entityId: raffleId,
      metadata: { previousStatus: raffle.status, nextStatus: status }
    });

    return mapRaffle(current);
  }

  await logRaffleAdminAction({
    raffleId,
    actorId,
    action: "raffle_status_updated",
    entityType: "raffle",
    entityId: raffleId,
    metadata: { previousStatus: raffle.status, nextStatus: status }
  });

  return mapRaffle(updated.data);
}

export async function updateRaffleService(
  raffleId: string,
  input: Partial<CreateRaffleInput>,
  actorId?: string
) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (typeof input.title === "string") payload.title = input.title.trim();
  if (typeof input.description === "string") payload.description = input.description.trim();
  if (typeof input.rulesText === "string") payload.rules_text = input.rulesText.trim();
  if (typeof input.imageUrl === "string") payload.image_url = input.imageUrl.trim() || null;
  if (typeof input.ctaLabel === "string") payload.cta_label = input.ctaLabel.trim() || null;
  if (typeof input.publicCtaLabel === "string") payload.cta_label = input.publicCtaLabel.trim() || null;
  if (typeof input.ctaHref === "string") payload.cta_href = input.ctaHref.trim() || null;
  if (typeof input.isFree === "boolean") payload.is_free = input.isFree;
  if (typeof input.entryFee === "number") payload.entry_fee = input.entryFee;
  if (typeof input.paymentInstructions === "string") payload.payment_instructions = input.paymentInstructions.trim();
  if (typeof input.requirements === "string") payload.requirements = input.requirements.trim();
  if (typeof input.prize === "string") payload.prize = input.prize.trim();
  if (typeof input.startDate === "string") payload.start_date = input.startDate;
  if (typeof input.endDate === "string") payload.end_date = input.endDate;
  if (typeof input.drawAt === "string") payload.draw_at = new Date(input.drawAt).toISOString();
  if (typeof input.status === "string") payload.status = input.status;
  if (typeof input.seoTitle === "string") payload.seo_title = input.seoTitle.trim() || null;
  if (typeof input.seoDescription === "string") payload.seo_description = input.seoDescription.trim() || null;
  if (typeof input.seoOgImage === "string") payload.seo_og_image = input.seoOgImage.trim() || null;

  if (typeof input.publicParticipantsEnabled === "boolean") payload.public_participants_enabled = input.publicParticipantsEnabled;
  if (typeof input.publicParticipantsMode === "string") payload.public_participants_mode = input.publicParticipantsMode;
  if (typeof input.publicNumbersVisibility === "boolean") payload.public_numbers_visibility = input.publicNumbersVisibility;
  if (typeof input.publicNumberGridMode === "string") payload.public_number_grid_mode = input.publicNumberGridMode;
  if (typeof input.publicWinnerName === "boolean") payload.public_winner_name = input.publicWinnerName;
  if (typeof input.verificationMode === "string") payload.verification_mode = input.verificationMode;
  if (typeof input.publicSeed === "string") payload.public_seed = input.publicSeed.trim() || null;
  if (typeof input.referralEnabled === "boolean") payload.referral_enabled = input.referralEnabled;
  if (typeof input.viralCounterEnabled === "boolean") payload.viral_counter_enabled = input.viralCounterEnabled;
  if (typeof input.urgencyMessage === "string") payload.urgency_message = input.urgencyMessage.trim() || null;
  if (typeof input.publicActivityEnabled === "boolean") payload.public_activity_enabled = input.publicActivityEnabled;
  if (typeof input.liveDrawEnabled === "boolean") payload.live_draw_enabled = input.liveDrawEnabled;

  const current = await getRaffleRowOrThrow(raffleId);
  const nextDrawPayload = { ...(current.draw_payload_json ?? {}) } as Record<string, unknown>;
  let shouldUpdateDrawPayload = false;

  if (Object.prototype.hasOwnProperty.call(input, "publicSubtitle")) {
    const subtitle = typeof input.publicSubtitle === "string" ? input.publicSubtitle.trim() : "";
    if (subtitle) {
      nextDrawPayload.public_subtitle = subtitle;
    } else {
      delete nextDrawPayload.public_subtitle;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "publicCtaLabel")) {
    const ctaLabel = typeof input.publicCtaLabel === "string" ? input.publicCtaLabel.trim() : "";
    if (ctaLabel) {
      nextDrawPayload.public_cta_label = ctaLabel;
    } else {
      delete nextDrawPayload.public_cta_label;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "promoBadges")) {
    const badges = sanitizeStringList(input.promoBadges);
    if (badges.length > 0) {
      nextDrawPayload.promo_badges = badges;
    } else {
      delete nextDrawPayload.promo_badges;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "faqItems")) {
    const faqItems = sanitizeFaqItems(input.faqItems);
    if (faqItems.length > 0) {
      nextDrawPayload.faq_items = faqItems;
    } else {
      delete nextDrawPayload.faq_items;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "prizeIncludes")) {
    const prizeIncludes = sanitizeStringList(input.prizeIncludes);
    if (prizeIncludes.length > 0) {
      nextDrawPayload.prize_includes = prizeIncludes;
    } else {
      delete nextDrawPayload.prize_includes;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "howToJoinItems")) {
    const howToJoinItems = sanitizeStringList(input.howToJoinItems);
    if (howToJoinItems.length > 0) {
      nextDrawPayload.how_to_join_items = howToJoinItems;
    } else {
      delete nextDrawPayload.how_to_join_items;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "paymentMethods")) {
    const paymentMethods = sanitizeRafflePaymentMethods(input.paymentMethods);
    if (paymentMethods.length > 0) {
      nextDrawPayload.payment_methods = paymentMethods;
      nextDrawPayload.payment_links = paymentMethodsToLinks(paymentMethods);
    } else {
      delete nextDrawPayload.payment_methods;
      if (!Object.prototype.hasOwnProperty.call(input, "paymentLinks")) {
        delete nextDrawPayload.payment_links;
      }
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "paymentLinks")) {
    const paymentLinks = sanitizeRafflePaymentLinks(input.paymentLinks);
    if (paymentLinks.length > 0) {
      nextDrawPayload.payment_links = paymentLinks;
    } else {
      delete nextDrawPayload.payment_links;
    }
    shouldUpdateDrawPayload = true;
  }

  if (Object.prototype.hasOwnProperty.call(input, "paymentLinksNote")) {
    const note = typeof input.paymentLinksNote === "string" && input.paymentLinksNote.trim()
      ? input.paymentLinksNote.trim()
      : "";
    if (note) {
      nextDrawPayload.payment_links_note = note;
    } else {
      delete nextDrawPayload.payment_links_note;
    }
    shouldUpdateDrawPayload = true;
  }

  if (shouldUpdateDrawPayload) {
    payload.draw_payload_json = nextDrawPayload;
  }

  if (typeof input.numberPoolSize === "number") {
    if (!Number.isInteger(input.numberPoolSize) || input.numberPoolSize < 1) {
      throw new Error("numberPoolSize inválido");
    }

    if (input.numberPoolSize < current.number_pool_size) {
      const activeAboveTarget = await supabase
        .from("app_raffle_numbers")
        .select("id")
        .eq("raffle_id", raffleId)
        .gt("number_value", input.numberPoolSize)
        .in("status", ["sold", "winner", "reserved", "pending_manual_review", "blocked"])
        .limit(1);

      if (activeAboveTarget.error) {
        throw new Error(`No se pudo validar reducción de números: ${activeAboveTarget.error.message}`);
      }

      if ((activeAboveTarget.data ?? []).length > 0) {
        throw new Error("No se puede reducir el pool porque hay números activos fuera del nuevo rango");
      }

      const cancelBeyondRange = await supabase
        .from("app_raffle_numbers")
        .update({ status: "cancelled", updated_at: new Date().toISOString(), admin_note: "fuera_de_rango" })
        .eq("raffle_id", raffleId)
        .gt("number_value", input.numberPoolSize);

      if (cancelBeyondRange.error) {
        throw new Error(`No se pudo ajustar números fuera de rango: ${cancelBeyondRange.error.message}`);
      }
    }

    payload.number_pool_size = input.numberPoolSize;
  }

  const updated = await supabase
    .from("app_raffles")
    .update(payload)
    .eq("id", raffleId)
    .select("*")
    .single<AppRaffleRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar sorteo: ${updated.error?.message ?? "sin datos"}`);
  }

  await ensureRaffleNumbersSeeded(raffleId, updated.data.number_pool_size);

  await logRaffleAdminAction({
    raffleId,
    actorId,
    action: "raffle_updated",
    entityType: "raffle",
    entityId: raffleId,
    metadata: { updatedFields: Object.keys(input) }
  });

  return mapRaffle(updated.data);
}

export async function updateRaffleNumbersService(input: BulkRaffleNumberMutationInput) {
  ensureConfigured();

  const raffle = await getRaffleRowOrThrow(input.raffleId);
  if (raffle.drawn_at) {
    throw new Error("No puedes modificar números después del draw");
  }

  if (!input.numbers.length) {
    return { ok: true, affected: 0 };
  }

  const supabase = getSupabaseAdminClient();
  const validNumbers = input.numbers
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0 && item <= raffle.number_pool_size);

  if (!validNumbers.length) {
    throw new Error("No hay números válidos para actualizar");
  }

  let status: RaffleNumberStatus;
  if (input.action === "block") status = "blocked";
  else if (input.action === "unblock") status = "available";
  else if (input.action === "reserve") status = "reserved";
  else if (input.action === "mark_sold") status = "sold";
  else status = "cancelled";

  const payload: Record<string, unknown> = {
    status,
    admin_note: input.note ?? null,
    blocked_reason: input.action === "block" ? input.blockedReason ?? "manual" : null,
    blocked_by: input.action === "block" ? input.actorId ?? null : null,
    blocked_at: input.action === "block" ? new Date().toISOString() : null,
    assigned_offline: input.action === "reserve" || input.action === "mark_sold",
    payment_method: input.paymentMethod ?? null,
    source: input.action === "reserve" || input.action === "mark_sold" ? "admin_manual" : "online",
    updated_by: input.actorId ?? null,
    updated_at: new Date().toISOString()
  };

  const update = await supabase
    .from("app_raffle_numbers")
    .update(payload)
    .eq("raffle_id", input.raffleId)
    .in("number_value", validNumbers)
    .select("id");

  if (update.error) {
    throw new Error(`No se pudieron actualizar números: ${update.error.message}`);
  }

  await logRaffleAdminAction({
    raffleId: input.raffleId,
    actorId: input.actorId,
    action: `number_bulk_${input.action}`,
    entityType: "raffle_number",
    metadata: { numbers: validNumbers, note: input.note, blockedReason: input.blockedReason }
  });

  return { ok: true, affected: (update.data ?? []).length };
}

export async function registerOfflineRaffleSaleService(input: RegisterOfflineRaffleSaleInput) {
  ensureConfigured();

  const raffle = await getRaffleRowOrThrow(input.raffleId);
  if (raffle.drawn_at) {
    throw new Error("No puedes registrar ventas offline después del draw");
  }

  const supabase = getSupabaseAdminClient();
  await ensureRaffleNumbersSeeded(raffle.id, raffle.number_pool_size);

  const email = normalizeEmail(input.email);
  const fullName = normalizeName(input.fullName);
  const phone = normalizePhone(input.phone);

  const customerUpsert = await supabase
    .from("app_customers")
    .upsert(
      {
        email,
        full_name: fullName,
        phone: phone ?? null,
        is_registered: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "email" }
    )
    .select("*")
    .single<AppCustomerRow>();

  if (customerUpsert.error || !customerUpsert.data) {
    throw new Error(`No se pudo registrar cliente offline: ${customerUpsert.error?.message ?? "sin datos"}`);
  }

  let targetNumbers = (input.numbers ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value));
  const quantity = Math.max(input.quantity ?? targetNumbers.length ?? 1, 1);

  if (!targetNumbers.length || input.randomAssignment) {
    const availableRows = await supabase
      .from("app_raffle_numbers")
      .select("number_value")
      .eq("raffle_id", raffle.id)
      .eq("status", "available")
      .order("number_value", { ascending: true })
      .limit(quantity)
      .returns<Array<{ number_value: number }>>();

    if (availableRows.error) {
      throw new Error(`No se pudieron asignar números offline: ${availableRows.error.message}`);
    }

    targetNumbers = (availableRows.data ?? []).map((item) => item.number_value);
  }

  if (!targetNumbers.length) {
    throw new Error("No hay números disponibles para registrar la venta offline");
  }

  const entries: RaffleEntry[] = [];
  const createdPaymentIds: string[] = [];

  for (const number of targetNumbers.slice(0, quantity)) {
    const row = await supabase
      .from("app_raffle_numbers")
      .select("status")
      .eq("raffle_id", raffle.id)
      .eq("number_value", number)
      .maybeSingle<{ status: RaffleNumberStatus }>();

    if (row.error) {
      throw new Error(`No se pudo validar número #${number}: ${row.error.message}`);
    }

    if (!row.data || row.data.status !== "available") {
      throw new Error(`El número #${number} no está disponible`);
    }

    const status: RaffleEntryStatus = input.markAsConfirmed === false ? "pending_review" : "confirmed";
    const paymentMethod = ensurePaymentMethod(input.paymentMethod);

    const entryInsert = await supabase
      .from("app_raffle_entries")
      .insert({
        raffle_id: raffle.id,
        customer_id: customerUpsert.data.id,
        customer_email: customerUpsert.data.email,
        chosen_number: number,
        payment_reference: input.paymentReference ?? null,
        note: input.note ?? null,
        status,
        source: "offline",
        public_display_name: fullName,
        consent_public_listing: true,
        payment_method: paymentMethod,
        phone: phone ?? null,
        referral_code: toReferralCode(email),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single<AppRaffleEntryRow>();

    if (entryInsert.error || !entryInsert.data) {
      if (isUniqueViolation(entryInsert.error)) {
        throw new Error(`La venta offline no pudo registrarse: número #${number} ya fue tomado`);
      }
      throw new Error(`Error creando participación offline: ${entryInsert.error?.message ?? "sin datos"}`);
    }

    await syncNumberForEntry(entryInsert.data, { actorId: input.actorId, paymentMethod });

    const amount = Number(
      typeof input.amount === "number" && Number.isFinite(input.amount)
        ? input.amount
        : raffle.entry_fee
    );

    const paymentInsert = await supabase
      .from("app_raffle_payments")
      .insert({
        raffle_id: raffle.id,
        entry_id: entryInsert.data.id,
        customer_id: customerUpsert.data.id,
        customer_email: customerUpsert.data.email,
        amount,
        currency: "USD",
        payment_method: paymentMethod,
        payment_reference: input.paymentReference ?? null,
        is_manual: true,
        manually_verified: input.markAsConfirmed !== false,
        status: input.markAsConfirmed === false ? "pending" : "approved",
        admin_note: input.note ?? null,
        verified_by: input.markAsConfirmed !== false ? input.actorId ?? null : null,
        verified_at: input.markAsConfirmed !== false ? new Date().toISOString() : null,
        created_by: input.actorId ?? null,
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single<{ id: string }>();

    if (paymentInsert.error || !paymentInsert.data) {
      throw new Error(`No se pudo registrar pago offline: ${paymentInsert.error?.message ?? "sin datos"}`);
    }

    entries.push(mapRaffleEntry(entryInsert.data));
    createdPaymentIds.push(paymentInsert.data.id);
  }

  await logRaffleAdminAction({
    raffleId: raffle.id,
    actorId: input.actorId,
    action: "offline_sale_registered",
    entityType: "raffle_entry",
    metadata: {
      numbers: targetNumbers.slice(0, quantity),
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      entriesCreated: entries.length,
      paymentIds: createdPaymentIds
    }
  });

  return {
    ok: true,
    entries,
    paymentIds: createdPaymentIds,
    numbers: targetNumbers.slice(0, quantity)
  };
}

export async function listRafflePaymentsService(raffleId: string) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const payments = await supabase
    .from("app_raffle_payments")
    .select("*")
    .eq("raffle_id", raffleId)
    .order("created_at", { ascending: false })
    .returns<AppRafflePaymentRow[]>();

  if (payments.error) {
    throw new Error(`No se pudieron cargar pagos de rifa: ${payments.error.message}`);
  }

  return (payments.data ?? []).map(mapRafflePayment);
}

export async function updateRafflePaymentManualStatusService(input: {
  paymentId: string;
  status: "approved" | "rejected" | "cancelled";
  manuallyVerified: boolean;
  adminNote?: string;
  actorId?: string;
}) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const existing = await supabase
    .from("app_raffle_payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle<AppRafflePaymentRow>();

  if (existing.error) {
    throw new Error(`No se pudo cargar pago: ${existing.error.message}`);
  }

  if (!existing.data) {
    throw new Error("Pago no encontrado");
  }

  const updated = await supabase
    .from("app_raffle_payments")
    .update({
      status: input.status,
      manually_verified: input.manuallyVerified,
      admin_note: input.adminNote ?? null,
      verified_by: input.actorId ?? null,
      verified_at: input.manuallyVerified ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.paymentId)
    .select("*")
    .single<AppRafflePaymentRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar pago: ${updated.error?.message ?? "sin datos"}`);
  }

  if (updated.data.entry_id) {
    const entryStatus: RaffleEntryStatus = input.status === "approved"
      ? "confirmed"
      : input.status === "rejected"
        ? "rejected"
        : "cancelled";

    await updateRaffleEntryStatusService(updated.data.entry_id, entryStatus, input.actorId);
  }

  await logRaffleAdminAction({
    raffleId: existing.data.raffle_id,
    actorId: input.actorId,
    action: "manual_payment_status_updated",
    entityType: "raffle_payment",
    entityId: input.paymentId,
    metadata: {
      previousStatus: existing.data.status,
      nextStatus: input.status,
      manuallyVerified: input.manuallyVerified
    }
  });

  return mapRafflePayment(updated.data);
}

export async function listRaffleAdminLogsService(raffleId: string, limit = 120) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const rows = await supabase
    .from("app_raffle_admin_logs")
    .select("*")
    .eq("raffle_id", raffleId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AppRaffleAdminLogRow[]>();

  if (rows.error) {
    throw new Error(`No se pudieron cargar logs de rifa: ${rows.error.message}`);
  }

  return (rows.data ?? []).map(mapRaffleAdminLog);
}

export async function listRaffleReferralLeaderboardService(raffleId: string) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const rows = await supabase
    .from("app_raffle_referral_events")
    .select("referral_code,event_type")
    .eq("raffle_id", raffleId)
    .returns<Array<{ referral_code: string; event_type: "click" | "conversion" }>>();

  if (rows.error) {
    throw new Error(`No se pudo cargar analítica de referidos: ${rows.error.message}`);
  }

  const aggregated = new Map<string, RaffleReferralLeaderboardItem>();

  for (const row of rows.data ?? []) {
    const key = row.referral_code;
    const current = aggregated.get(key) ?? { referralCode: key, clicks: 0, conversions: 0 };

    if (row.event_type === "click") current.clicks += 1;
    if (row.event_type === "conversion") current.conversions += 1;

    aggregated.set(key, current);
  }

  return [...aggregated.values()].sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks);
}

export async function trackRaffleReferralClickService(raffleId: string, referralCode: string, metadata?: Record<string, unknown>) {
  ensureConfigured();

  const code = referralCode.trim().toUpperCase();
  if (!code) {
    throw new Error("Referral code requerido");
  }

  const supabase = getSupabaseAdminClient();
  const insert = await supabase.from("app_raffle_referral_events").insert({
    raffle_id: raffleId,
    referral_code: code,
    event_type: "click",
    metadata_json: metadata ?? {}
  });

  if (insert.error) {
    throw new Error(`No se pudo registrar click de referido: ${insert.error.message}`);
  }

  return { ok: true };
}

export async function listPublicRaffleParticipantsService(raffleId: string) {
  ensureConfigured();

  const raffle = await getRaffleByIdService(raffleId);
  if (!raffle) {
    throw new Error("Sorteo no encontrado");
  }

  if (!raffle.publicParticipantsEnabled || raffle.publicParticipantsMode === "hidden") {
    return [] as PublicRaffleParticipant[];
  }

  const entries = await listRaffleEntriesService(raffleId);
  const filtered = entries.filter((entry) => entry.status === "confirmed" && (entry.consentPublicListing ?? true));

  return filtered.map((entry) => ({
    entryId: entry.id,
    displayName: toPublicDisplayName(entry, raffle.publicParticipantsMode ?? "masked"),
    chosenNumber: raffle.publicParticipantsMode === "name_number" ? entry.chosenNumber : undefined,
    status: entry.status,
    createdAt: entry.createdAt,
    source: entry.source ?? "online"
  }));
}

export async function getRafflePublicSummaryService(raffleId: string): Promise<RafflePublicSummary> {
  ensureConfigured();

  const raffle = await getRaffleByIdService(raffleId);
  if (!raffle) {
    throw new Error("Sorteo no encontrado");
  }

  const numbers = await listRaffleNumbersService(raffleId, { limit: raffle.numberPoolSize });
  const entries = await listRaffleEntriesService(raffleId);

  const soldNumbers = numbers.filter((item) => item.status === "sold" || item.status === "winner").length;
  const availableNumbers = numbers.filter((item) => item.status === "available").length;
  const blockedNumbers = numbers.filter((item) => item.status === "blocked").length;
  const reservedNumbers = numbers.filter((item) => item.status === "reserved" || item.status === "pending_manual_review").length;

  let list = numbers;
  const mode = raffle.publicNumberGridMode ?? "full";
  if (mode === "available_only") {
    list = numbers.filter((item) => item.status === "available");
  } else if (mode === "sold_only") {
    list = numbers.filter((item) => item.status === "sold" || item.status === "winner");
  } else if (mode === "totals_only") {
    list = [];
  }

  return {
    raffle,
    metrics: {
      totalNumbers: raffle.numberPoolSize,
      soldNumbers,
      availableNumbers,
      blockedNumbers,
      reservedNumbers,
      progressPercent: raffle.numberPoolSize > 0 ? Math.round((soldNumbers / raffle.numberPoolSize) * 100) : 0,
      confirmedEntries: entries.filter((entry) => entry.status === "confirmed").length,
      countdownTo: raffle.drawAt
    },
    publicGridMode: mode,
    publicNumbersVisibility: raffle.publicNumbersVisibility ?? true,
    numbers: list.map((item) => ({ number: item.numberValue, status: item.status }))
  };
}

export async function getRaffleVerificationPayloadService(raffleId: string): Promise<RaffleVerificationPayload | null> {
  ensureConfigured();
  const raffle = await getRaffleByIdService(raffleId);
  if (!raffle) {
    return null;
  }

  const payload = (raffle.drawPayloadJson ?? {}) as Record<string, unknown>;

  const normalized: RaffleVerificationPayload = {
    raffleId: raffle.id,
    algorithm: (payload.algorithm as RaffleDrawAlgorithm) ?? raffle.drawAlgorithm ?? "sha256-modulo-v1",
    verificationMode: (payload.verification_mode as RaffleVerificationMode) ?? raffle.verificationMode ?? "commit_reveal",
    drawAt: raffle.drawAt,
    drawnAt: raffle.drawnAt,
    publicSeed: (payload.public_seed as string) ?? raffle.publicSeed,
    commitHash: (payload.commit_hash as string) ?? raffle.secretCommitHash,
    revealSecret: typeof payload.reveal_secret === "string" ? payload.reveal_secret : undefined,
    eligibleNumbers: Array.isArray(payload.eligible_numbers)
      ? payload.eligible_numbers.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
      : [],
    hashInput: typeof payload.hash_input === "string" ? payload.hash_input : undefined,
    drawHash: typeof payload.draw_hash === "string" ? payload.draw_hash : undefined,
    winnerNumber: typeof payload.winner_number === "number" ? payload.winner_number : raffle.winnerNumber,
    winnerEntryId: typeof payload.winner_entry_id === "string" ? payload.winner_entry_id : raffle.winnerEntryId
  };

  return normalized;
}

export async function getRaffleAdminSnapshotService(raffleId: string): Promise<RaffleAdminSnapshot> {
  ensureConfigured();

  const raffle = await getRaffleByIdService(raffleId);
  if (!raffle) {
    throw new Error("Sorteo no encontrado");
  }

  const [numbers, entries, payments, logs, referrals] = await Promise.all([
    listRaffleNumbersService(raffleId, { limit: raffle.numberPoolSize }),
    listRaffleEntriesService(raffleId),
    listRafflePaymentsService(raffleId),
    listRaffleAdminLogsService(raffleId),
    listRaffleReferralLeaderboardService(raffleId)
  ]);

  return {
    raffle,
    metrics: {
      totalNumbers: raffle.numberPoolSize,
      available: numbers.filter((item) => item.status === "available").length,
      blocked: numbers.filter((item) => item.status === "blocked").length,
      reserved: numbers.filter((item) => item.status === "reserved").length,
      pendingManualReview: numbers.filter((item) => item.status === "pending_manual_review").length,
      sold: numbers.filter((item) => item.status === "sold").length,
      cancelled: numbers.filter((item) => item.status === "cancelled").length,
      winners: numbers.filter((item) => item.status === "winner").length,
      confirmedEntries: entries.filter((item) => item.status === "confirmed").length,
      pendingEntries: entries.filter((item) => isPendingEntryStatus(item.status)).length,
      rejectedEntries: entries.filter((item) => item.status === "rejected" || item.status === "cancelled").length,
      offlineEntries: entries.filter((item) => item.source === "offline" || item.source === "admin_manual").length,
      conversionsFromReferral: referrals.reduce((sum, item) => sum + item.conversions, 0)
    },
    numbers,
    entries,
    payments,
    logs,
    referrals
  };
}

export async function deleteRaffleService(raffleId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase.from("app_raffles").delete().eq("id", raffleId);

  if (result.error) {
    throw new Error(`No se pudo eliminar sorteo: ${result.error.message}`);
  }

  await logRaffleAdminAction({
    raffleId,
    action: "raffle_deleted",
    entityType: "raffle",
    entityId: raffleId
  });

  return { ok: true };
}

export async function drawRaffleWinnerService(raffleId: string, actorId?: string) {
  ensureConfigured();

  return drawRaffleWinnerSupabase(raffleId, { force: true, actorId });
}

export async function verifyRaffleDrawService(raffleId: string) {
  ensureConfigured();

  const payload = await getRaffleVerificationPayloadService(raffleId);
  if (!payload) {
    throw new Error("Sorteo no encontrado");
  }

  if (payload.verificationMode !== "commit_reveal") {
    return { verified: false, reason: "verification_mode_disabled", payload };
  }

  if (!payload.publicSeed || !payload.revealSecret || !payload.commitHash || !payload.hashInput || !payload.drawHash) {
    return { verified: false, reason: "missing_payload", payload };
  }

  const recomputedCommit = hashSha256(`${payload.publicSeed}:${payload.revealSecret}`);
  const recomputedHash = hashSha256(payload.hashInput);

  const commitOk = recomputedCommit === payload.commitHash;
  const hashOk = recomputedHash === payload.drawHash;

  let winnerOk = true;
  if (payload.eligibleNumbers.length > 0 && typeof payload.winnerNumber === "number") {
    const winnerIndex = Number(BigInt(`0x${payload.drawHash.slice(0, 15)}`) % BigInt(payload.eligibleNumbers.length));
    winnerOk = payload.eligibleNumbers[winnerIndex] === payload.winnerNumber;
  }

  return {
    verified: commitOk && hashOk && winnerOk,
    checks: {
      commit: commitOk,
      hash: hashOk,
      winner: winnerOk
    },
    payload
  };
}
