import { hasSupabaseConfig, getSupabaseAdminClient } from "@/lib/supabase-admin";
import { Customer, Raffle, RaffleEntry, RaffleEntryStatus } from "@/lib/types";

export interface RegisterCustomerInput {
  fullName: string;
  email: string;
  phone: string;
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
}

export interface DrawRaffleWinnerResult {
  raffle: Raffle;
  winnerEntry: RaffleEntry | null;
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
    createdAt: row.created_at
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

async function syncProfileFromRegistration(input: { authUserId: string; email: string; phone: string }) {
  const supabase = getSupabaseAdminClient();
  const basePayload = {
    id: input.authUserId,
    email: normalizeEmail(input.email),
    role: "user"
  };

  const withPhone = await supabase.from("profiles").upsert(
    {
      ...basePayload,
      phone: input.phone.trim()
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

async function drawRaffleWinnerSupabase(
  raffleId: string,
  options?: { force?: boolean }
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

  const entriesResult = await supabase
    .from("app_raffle_entries")
    .select("*")
    .eq("raffle_id", raffleId)
    .eq("status", "confirmed")
    .returns<AppRaffleEntryRow[]>();

  if (entriesResult.error) {
    throw new Error(`Error consultando participaciones: ${entriesResult.error.message}`);
  }

  const eligibleEntries = entriesResult.data ?? [];
  const chosenWinner = eligibleEntries.length > 0
    ? eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)]
    : null;

  const updatePayload = {
    status: "closed" as const,
    drawn_at: now.toISOString(),
    winner_entry_id: chosenWinner?.id ?? null,
    winner_number: chosenWinner?.chosen_number ?? null,
    winner_customer_email: chosenWinner?.customer_email ?? null
  };

  const update = await supabase
    .from("app_raffles")
    .update(updatePayload)
    .eq("id", raffleId)
    .select("*")
    .single<AppRaffleRow>();

  if (update.error || !update.data) {
    throw new Error(`Error cerrando sorteo: ${update.error?.message ?? "sin datos"}`);
  }

  return {
    raffle: mapRaffle(update.data),
    winnerEntry: chosenWinner ? mapRaffleEntry(chosenWinner) : null
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
  const payload: Record<string, unknown> = {
    full_name: input.fullName.trim(),
    email: normalizeEmail(input.email),
    phone: input.phone.trim(),
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

  return (response.data ?? []).map(mapRaffleEntry);
}

export async function listAvailableRaffleNumbersService(raffleId: string) {
  ensureConfigured();

  await runDueRaffleDrawsSupabase();
  const raffle = await getRaffleRowOrThrow(raffleId);
  const supabase = getSupabaseAdminClient();
  const entries = await supabase
    .from("app_raffle_entries")
    .select("chosen_number")
    .eq("raffle_id", raffleId)
    .neq("status", "rejected")
    .returns<Array<{ chosen_number: number }>>();

  if (entries.error) {
    throw new Error(`No se pudieron cargar números ocupados: ${entries.error.message}`);
  }

  const taken = new Set((entries.data ?? []).map((row) => row.chosen_number));
  const available: number[] = [];

  for (let number = 1; number <= raffle.number_pool_size; number += 1) {
    if (!taken.has(number)) {
      available.push(number);
    }
  }

  return available;
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

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_raffles")
    .insert({
      title: input.title,
      description: input.description,
      rules_text: input.rulesText ?? input.requirements,
      image_url: input.imageUrl ?? null,
      cta_label: input.ctaLabel ?? null,
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
      seo_og_image: input.seoOgImage ?? null
    })
    .select("*")
    .single<AppRaffleRow>();

  if (result.error || !result.data) {
    throw new Error(`No se pudo crear el sorteo: ${result.error?.message ?? "sin datos"}`);
  }

  return mapRaffle(result.data);
}

export async function enterRaffleService(
  raffleId: string,
  customerEmail: string,
  chosenNumber: number,
  note?: string,
  paymentReference?: string
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
    .maybeSingle<{ id: string }>();

  if (existing.error) {
    throw new Error(`Error validando participación: ${existing.error.message}`);
  }
  if (existing.data) {
    throw new Error("Ya participas en este sorteo");
  }

  const status: RaffleEntryStatus = raffle.is_free
    ? "confirmed"
    : paymentReference
      ? "pending_review"
      : "pending_payment";

  const insert = await supabase
    .from("app_raffle_entries")
    .insert({
      raffle_id: raffleId,
      customer_id: customer.data.id,
      customer_email: customer.data.email,
      chosen_number: chosenNumber,
      payment_reference: paymentReference ?? null,
      note: note ?? null,
      status
    })
    .select("*")
    .single<AppRaffleEntryRow>();

  if (insert.error || !insert.data) {
    if (isUniqueViolation(insert.error)) {
      throw new Error("Ese número ya fue seleccionado por otro participante");
    }

    throw new Error(`No se pudo registrar participación: ${insert.error?.message ?? "sin datos"}`);
  }

  return mapRaffleEntry(insert.data);
}

export async function updateRaffleEntryStatusService(entryId: string, status: RaffleEntryStatus) {
  ensureConfigured();

  const supabase = getSupabaseAdminClient();
  const entry = await supabase
    .from("app_raffle_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle<AppRaffleEntryRow>();

  if (entry.error) {
    throw new Error(`Error consultando participación: ${entry.error.message}`);
  }
  if (!entry.data) {
    return null;
  }

  const raffle = await getRaffleRowOrThrow(entry.data.raffle_id);
  if (raffle.drawn_at) {
    throw new Error("No se puede editar participaciones de un sorteo ya sorteado");
  }

  const updated = await supabase
    .from("app_raffle_entries")
    .update({ status })
    .eq("id", entryId)
    .select("*")
    .single<AppRaffleEntryRow>();

  if (updated.error || !updated.data) {
    if (isUniqueViolation(updated.error)) {
      throw new Error("El número ya fue reasignado a otro participante");
    }

    throw new Error(`No se pudo actualizar participación: ${updated.error?.message ?? "sin datos"}`);
  }

  return mapRaffleEntry(updated.data);
}

export async function updateRaffleStatusService(raffleId: string, status: Raffle["status"]) {
  ensureConfigured();

  const raffle = await getRaffleRowOrThrow(raffleId);
  if (raffle.drawn_at && status === "published") {
    throw new Error("No se puede reabrir un sorteo ya sorteado");
  }

  const supabase = getSupabaseAdminClient();
  const updated = await supabase
    .from("app_raffles")
    .update({ status })
    .eq("id", raffleId)
    .select("*")
    .single<AppRaffleRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar estado: ${updated.error?.message ?? "sin datos"}`);
  }

  if (status === "published") {
    await runDueRaffleDrawsSupabase();
    const current = await getRaffleRowOrThrow(raffleId);
    return mapRaffle(current);
  }

  return mapRaffle(updated.data);
}

export async function updateRaffleService(
  raffleId: string,
  input: Partial<CreateRaffleInput>
) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {};

  if (typeof input.title === "string") payload.title = input.title.trim();
  if (typeof input.description === "string") payload.description = input.description.trim();
  if (typeof input.rulesText === "string") payload.rules_text = input.rulesText.trim();
  if (typeof input.imageUrl === "string") payload.image_url = input.imageUrl.trim() || null;
  if (typeof input.ctaLabel === "string") payload.cta_label = input.ctaLabel.trim() || null;
  if (typeof input.ctaHref === "string") payload.cta_href = input.ctaHref.trim() || null;
  if (typeof input.isFree === "boolean") payload.is_free = input.isFree;
  if (typeof input.entryFee === "number") payload.entry_fee = input.entryFee;
  if (typeof input.paymentInstructions === "string") payload.payment_instructions = input.paymentInstructions.trim();
  if (typeof input.requirements === "string") payload.requirements = input.requirements.trim();
  if (typeof input.prize === "string") payload.prize = input.prize.trim();
  if (typeof input.startDate === "string") payload.start_date = input.startDate;
  if (typeof input.endDate === "string") payload.end_date = input.endDate;
  if (typeof input.drawAt === "string") payload.draw_at = new Date(input.drawAt).toISOString();
  if (typeof input.numberPoolSize === "number") payload.number_pool_size = input.numberPoolSize;
  if (typeof input.status === "string") payload.status = input.status;
  if (typeof input.seoTitle === "string") payload.seo_title = input.seoTitle.trim() || null;
  if (typeof input.seoDescription === "string") payload.seo_description = input.seoDescription.trim() || null;
  if (typeof input.seoOgImage === "string") payload.seo_og_image = input.seoOgImage.trim() || null;

  const updated = await supabase
    .from("app_raffles")
    .update(payload)
    .eq("id", raffleId)
    .select("*")
    .single<AppRaffleRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar sorteo: ${updated.error?.message ?? "sin datos"}`);
  }

  return mapRaffle(updated.data);
}

export async function deleteRaffleService(raffleId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase.from("app_raffles").delete().eq("id", raffleId);

  if (result.error) {
    throw new Error(`No se pudo eliminar sorteo: ${result.error.message}`);
  }

  return { ok: true };
}

export async function drawRaffleWinnerService(raffleId: string) {
  ensureConfigured();

  return drawRaffleWinnerSupabase(raffleId, { force: true });
}
