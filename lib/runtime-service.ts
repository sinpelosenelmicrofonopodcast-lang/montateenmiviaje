import { addDays, addMonths } from "@/lib/date-utils";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import {
  AutomationRun,
  BookingRecord,
  BookingStage,
  ClientProposalResponse,
  Customer,
  CustomPackageProposal,
  CustomRequestStatus,
  CustomTripRequest,
  DocumentRecord,
  EmailLog,
  PaymentRecord,
  PaymentStatus,
  ReportSnapshot,
  RoomType,
  Trip
} from "@/lib/types";

export interface CreateBookingInput {
  customerName: string;
  customerEmail: string;
  tripSlug: string;
  roomType: RoomType;
  travelers: number;
  depositAmount: number;
}

export interface CreateCustomTripRequestInput {
  customerName: string;
  customerEmail: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  motive: string;
  expectations: string;
}

export interface CreateCustomProposalInput {
  title: string;
  summary: string;
  itinerary: string[];
  includes: string[];
  excludes: string[];
  pricePerPerson: number;
  deposit: number;
  paymentPlan: string;
  notes: string;
  pdfUrl: string;
  pageUrl: string;
}

interface AppCustomerRow {
  id: string;
  full_name: string;
  email: string;
  is_registered: boolean;
  phone: string | null;
  country: string | null;
  preferences: string[] | null;
  notes: string[] | null;
  pipeline_stage: BookingStage;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AppBookingRow {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  trip_slug: string;
  room_type: RoomType;
  travelers: number;
  amount: number | string;
  total_amount: number | string;
  balance_amount: number | string;
  status: BookingStage;
  paypal_order_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AppPaymentRow {
  id: string;
  booking_id: string;
  customer_email: string;
  trip_slug: string;
  amount: number | string;
  currency: "USD";
  payment_type: "deposit" | "installment" | "balance" | "addon";
  due_date: string | null;
  paid_at: string | null;
  status: PaymentStatus;
  paypal_order_id: string | null;
  created_at: string;
}

interface AppDocumentRow {
  id: string;
  entity_type: "trip" | "booking" | "customer" | "proposal";
  entity_id: string;
  title: string;
  language: "es" | "en";
  audience: "client" | "internal";
  include_prices: boolean;
  download_url: string;
  created_at: string;
}

interface AppAutomationRuleRow {
  id: string;
  name: string;
  trigger_event: string;
  channel: "email" | "whatsapp";
  active: boolean;
}

interface AppAutomationRunRow {
  id: string;
  rule_id: string | null;
  rule_name: string;
  channel: "email" | "whatsapp";
  recipient: string;
  entity_type: "booking" | "payment" | "trip" | "proposal";
  entity_id: string;
  status: "queued" | "sent" | "failed" | "skipped";
  scheduled_at: string;
  created_at: string;
}

interface AppCustomTripRequestRow {
  id: string;
  customer_name: string;
  customer_email: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number | string;
  motive: string;
  expectations: string;
  status: CustomRequestStatus;
  created_at: string;
  updated_at: string;
}

interface AppCustomPackageProposalRow {
  id: string;
  request_id: string;
  title: string;
  summary: string;
  itinerary: string[] | null;
  includes: string[] | null;
  excludes: string[] | null;
  price_per_person: number | string;
  deposit: number | string;
  payment_plan: string;
  notes: string;
  pdf_url: string;
  page_url: string;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface AppClientProposalResponseRow {
  id: string;
  request_id: string;
  action: "accept" | "changes";
  message: string;
  created_at: string;
}

interface AppEmailLogRow {
  id: string;
  recipient: string;
  subject: string;
  body_preview: string;
  provider: "resend" | "simulated";
  sent_at: string;
}

interface CustomerWithStats extends Customer {
  bookingsCount: number;
  lifetimeValue: number;
}

interface PortalBundle {
  customer: CustomerWithStats | null;
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  documents: DocumentRecord[];
}

function ensureConfigured() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase no está configurado");
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseMoney(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function parseInstallmentCount(paymentPlan: string) {
  const match = paymentPlan.match(/(\d+)\s*cuotas/i);
  const count = match ? Number(match[1]) : 2;
  return Number.isFinite(count) && count > 0 ? count : 2;
}

function mapCustomer(row: AppCustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    isRegistered: row.is_registered,
    phone: row.phone ?? undefined,
    country: row.country ?? undefined,
    preferences: row.preferences ?? [],
    notes: row.notes ?? [],
    pipelineStage: row.pipeline_stage,
    tags: row.tags ?? []
  };
}

function mapBooking(row: AppBookingRow): BookingRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    tripSlug: row.trip_slug,
    roomType: row.room_type,
    travelers: row.travelers,
    amount: parseMoney(row.amount),
    totalAmount: parseMoney(row.total_amount),
    balanceAmount: parseMoney(row.balance_amount),
    status: row.status,
    paypalOrderId: row.paypal_order_id ?? undefined,
    createdAt: row.created_at
  };
}

function mapPayment(row: AppPaymentRow): PaymentRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    customerEmail: row.customer_email,
    tripSlug: row.trip_slug,
    amount: parseMoney(row.amount),
    currency: row.currency,
    paymentType: row.payment_type,
    dueDate: row.due_date ?? undefined,
    paidAt: row.paid_at ?? undefined,
    status: row.status,
    paypalOrderId: row.paypal_order_id ?? undefined
  };
}

function mapDocument(row: AppDocumentRow): DocumentRecord {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    language: row.language,
    audience: row.audience,
    includePrices: row.include_prices,
    createdAt: row.created_at,
    downloadUrl: row.download_url
  };
}

function mapAutomationRun(row: AppAutomationRunRow): AutomationRun {
  return {
    id: row.id,
    ruleId: row.rule_id ?? "",
    ruleName: row.rule_name,
    channel: row.channel,
    recipient: row.recipient,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status === "sent" ? "sent" : "queued",
    scheduledAt: row.scheduled_at
  };
}

function mapCustomRequest(row: AppCustomTripRequestRow): CustomTripRequest {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    travelers: row.travelers,
    budget: parseMoney(row.budget),
    motive: row.motive,
    expectations: row.expectations,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCustomProposal(row: AppCustomPackageProposalRow): CustomPackageProposal {
  return {
    id: row.id,
    requestId: row.request_id,
    title: row.title,
    summary: row.summary,
    itinerary: row.itinerary ?? [],
    includes: row.includes ?? [],
    excludes: row.excludes ?? [],
    pricePerPerson: parseMoney(row.price_per_person),
    deposit: parseMoney(row.deposit),
    paymentPlan: row.payment_plan,
    notes: row.notes,
    pdfUrl: row.pdf_url,
    pageUrl: row.page_url,
    revision: row.revision,
    createdAt: row.updated_at || row.created_at
  };
}

function mapClientProposalResponse(row: AppClientProposalResponseRow): ClientProposalResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    action: row.action,
    message: row.message,
    createdAt: row.created_at
  };
}

function mapEmailLog(row: AppEmailLogRow): EmailLog {
  return {
    id: row.id,
    to: row.recipient,
    subject: row.subject,
    bodyPreview: row.body_preview,
    sentAt: row.sent_at,
    provider: row.provider
  };
}

async function getOrCreateCustomerByEmail(input: {
  fullName: string;
  email: string;
  pipelineStage?: BookingStage;
}): Promise<AppCustomerRow> {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const email = normalizeEmail(input.email);

  const existing = await supabase
    .from("app_customers")
    .select("*")
    .eq("email", email)
    .maybeSingle<AppCustomerRow>();

  if (existing.error) {
    throw new Error(`No se pudo consultar cliente: ${existing.error.message}`);
  }

  if (existing.data) {
    const nextTags = new Set(existing.data.tags ?? []);
    nextTags.add("customer");

    const update = await supabase
      .from("app_customers")
      .update({
        full_name: input.fullName.trim(),
        pipeline_stage: input.pipelineStage ?? existing.data.pipeline_stage,
        tags: [...nextTags],
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.data.id)
      .select("*")
      .single<AppCustomerRow>();

    if (update.error || !update.data) {
      throw new Error(`No se pudo actualizar cliente: ${update.error?.message ?? "sin datos"}`);
    }

    return update.data;
  }

  const insert = await supabase
    .from("app_customers")
    .insert({
      full_name: input.fullName.trim(),
      email,
      is_registered: false,
      preferences: ["premium", "grupo"],
      notes: ["Lead generado desde plataforma"],
      pipeline_stage: input.pipelineStage ?? "lead",
      tags: ["new"]
    })
    .select("*")
    .single<AppCustomerRow>();

  if (insert.error || !insert.data) {
    throw new Error(`No se pudo crear cliente: ${insert.error?.message ?? "sin datos"}`);
  }

  return insert.data;
}

async function queueAutomations(
  event: string,
  entityType: AppAutomationRunRow["entity_type"],
  entityId: string,
  recipient: string,
  daysOffset = 0
) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const rules = await supabase
    .from("app_automation_rules")
    .select("*")
    .eq("active", true)
    .eq("trigger_event", event)
    .returns<AppAutomationRuleRow[]>();

  if (rules.error) {
    throw new Error(`No se pudieron cargar reglas de automatización: ${rules.error.message}`);
  }

  const activeRules = rules.data ?? [];
  if (activeRules.length === 0) {
    return;
  }

  const now = new Date();
  const scheduledAt = addDays(now, daysOffset).toISOString();

  const insert = await supabase.from("app_automation_runs").insert(
    activeRules.map((rule) => ({
      rule_id: rule.id,
      rule_name: rule.name,
      channel: rule.channel,
      recipient,
      entity_type: entityType,
      entity_id: entityId,
      status: "queued",
      scheduled_at: scheduledAt
    }))
  );

  if (insert.error) {
    throw new Error(`No se pudieron encolar automatizaciones: ${insert.error.message}`);
  }
}

async function listPaymentsByBookingId(bookingId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_payments")
    .select("*")
    .eq("booking_id", bookingId)
    .returns<AppPaymentRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar pagos de reserva: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapPayment);
}

async function updateCustomerPipeline(customerId: string, stage: BookingStage) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_customers")
    .update({
      pipeline_stage: stage,
      updated_at: new Date().toISOString()
    })
    .eq("id", customerId);

  if (result.error) {
    throw new Error(`No se pudo actualizar pipeline de cliente: ${result.error.message}`);
  }
}

export async function createBookingWithTripService(input: CreateBookingInput, trip: Trip) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const selectedPackage = trip.packages.find((pkg) => pkg.roomType === input.roomType);
  if (!selectedPackage) {
    throw new Error("Tipo de habitación inválido");
  }

  const totalAmount = selectedPackage.pricePerPerson * input.travelers;
  const expectedDeposit = selectedPackage.deposit * input.travelers;
  if (Math.abs(expectedDeposit - input.depositAmount) > 0.01) {
    throw new Error("Monto de depósito inválido");
  }

  const tripRow = await supabase
    .from("app_trips")
    .select("id, available_spots")
    .eq("slug", input.tripSlug)
    .maybeSingle<{ id: string; available_spots: number }>();

  if (tripRow.error) {
    throw new Error(`No se pudo validar cupos del viaje: ${tripRow.error.message}`);
  }
  if (!tripRow.data) {
    throw new Error("Viaje no encontrado");
  }

  if (tripRow.data.available_spots < input.travelers) {
    throw new Error("No hay cupos suficientes para esta reserva");
  }

  const customer = await getOrCreateCustomerByEmail({
    fullName: input.customerName,
    email: input.customerEmail,
    pipelineStage: "reservado"
  });

  const bookingInsert = await supabase
    .from("app_bookings")
    .insert({
      customer_id: customer.id,
      customer_name: input.customerName.trim(),
      customer_email: normalizeEmail(input.customerEmail),
      trip_slug: input.tripSlug,
      room_type: input.roomType,
      travelers: input.travelers,
      amount: input.depositAmount,
      total_amount: totalAmount,
      balance_amount: Math.max(totalAmount - input.depositAmount, 0),
      status: "reservado"
    })
    .select("*")
    .single<AppBookingRow>();

  if (bookingInsert.error || !bookingInsert.data) {
    throw new Error(`No se pudo crear reserva: ${bookingInsert.error?.message ?? "sin datos"}`);
  }

  const booking = mapBooking(bookingInsert.data);

  const tripSpotUpdate = await supabase
    .from("app_trips")
    .update({
      available_spots: Math.max(tripRow.data.available_spots - input.travelers, 0),
      updated_at: new Date().toISOString()
    })
    .eq("id", tripRow.data.id);

  if (tripSpotUpdate.error) {
    throw new Error(`No se pudieron actualizar cupos: ${tripSpotUpdate.error.message}`);
  }

  const paymentRows: Array<Record<string, unknown>> = [
    {
      booking_id: booking.id,
      customer_email: booking.customerEmail,
      trip_slug: booking.tripSlug,
      amount: booking.amount,
      currency: "USD",
      payment_type: "deposit",
      due_date: new Date().toISOString().slice(0, 10),
      status: "pending"
    }
  ];

  if (booking.balanceAmount > 0) {
    const installments = parseInstallmentCount(selectedPackage.paymentPlan);
    const eachInstallment = Number((booking.balanceAmount / installments).toFixed(2));

    for (let index = 1; index <= installments; index += 1) {
      paymentRows.push({
        booking_id: booking.id,
        customer_email: booking.customerEmail,
        trip_slug: booking.tripSlug,
        amount: eachInstallment,
        currency: "USD",
        payment_type: index === installments ? "balance" : "installment",
        due_date: addMonths(new Date(), index).toISOString().slice(0, 10),
        status: "pending"
      });
    }
  }

  const paymentsInsert = await supabase.from("app_payments").insert(paymentRows);
  if (paymentsInsert.error) {
    throw new Error(`No se pudo crear calendario de pagos: ${paymentsInsert.error.message}`);
  }

  await Promise.all([
    queueAutomations("booking.created", "booking", booking.id, booking.customerEmail),
    queueAutomations("payment.due_soon", "payment", booking.id, booking.customerEmail, 14),
    queueAutomations("trip.upcoming", "trip", trip.id, booking.customerEmail, 30)
  ]);

  return booking;
}

export async function getBookingService(id: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle<AppBookingRow>();

  if (result.error) {
    throw new Error(`No se pudo cargar la reserva: ${result.error.message}`);
  }

  return result.data ? mapBooking(result.data) : null;
}

export async function listBookingsService() {
  if (!hasSupabaseConfig()) {
    return [] as BookingRecord[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<AppBookingRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar reservas: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapBooking);
}

export async function updateBookingStageService(bookingId: string, stage: BookingStage) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const current = await supabase
    .from("app_bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<AppBookingRow>();

  if (current.error) {
    throw new Error(`No se pudo consultar reserva: ${current.error.message}`);
  }
  if (!current.data) {
    return null;
  }

  const updated = await supabase
    .from("app_bookings")
    .update({ status: stage, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select("*")
    .single<AppBookingRow>();

  if (updated.error || !updated.data) {
    throw new Error(`No se pudo actualizar reserva: ${updated.error?.message ?? "sin datos"}`);
  }

  await updateCustomerPipeline(updated.data.customer_id, stage);
  return mapBooking(updated.data);
}

export async function listPaymentsService() {
  if (!hasSupabaseConfig()) {
    return [] as PaymentRecord[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_payments")
    .select("*")
    .order("due_date", { ascending: true })
    .returns<AppPaymentRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar pagos: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapPayment);
}

export async function listCustomersService() {
  if (!hasSupabaseConfig()) {
    return [] as CustomerWithStats[];
  }

  const supabase = getSupabaseAdminClient();
  const [customersResult, bookings] = await Promise.all([
    supabase
      .from("app_customers")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<AppCustomerRow[]>(),
    listBookingsService()
  ]);

  if (customersResult.error) {
    throw new Error(`No se pudieron cargar clientes: ${customersResult.error.message}`);
  }

  return (customersResult.data ?? []).map((row) => {
    const customer = mapCustomer(row);
    const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);
    const lifetimeValue = customerBookings.reduce((total, booking) => total + booking.totalAmount, 0);

    return {
      ...customer,
      bookingsCount: customerBookings.length,
      lifetimeValue
    };
  });
}

export async function listDocumentsService(
  entityType?: DocumentRecord["entityType"],
  entityId?: string
) {
  if (!hasSupabaseConfig()) {
    return [] as DocumentRecord[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("app_documents").select("*").order("created_at", { ascending: false });

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }
  if (entityId) {
    query = query.eq("entity_id", entityId);
  }

  const result = await query.returns<AppDocumentRow[]>();
  if (result.error) {
    throw new Error(`No se pudieron cargar documentos: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapDocument);
}

export async function createDocumentRecordService(input: Omit<DocumentRecord, "id" | "createdAt">) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const result = await supabase
    .from("app_documents")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title,
      language: input.language,
      audience: input.audience,
      include_prices: input.includePrices,
      download_url: input.downloadUrl
    })
    .select("*")
    .single<AppDocumentRow>();

  if (result.error || !result.data) {
    throw new Error(`No se pudo guardar documento: ${result.error?.message ?? "sin datos"}`);
  }

  return mapDocument(result.data);
}

export async function listAutomationRunsService() {
  if (!hasSupabaseConfig()) {
    return [] as AutomationRun[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_automation_runs")
    .select("*")
    .order("scheduled_at", { ascending: false })
    .returns<AppAutomationRunRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar ejecuciones: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapAutomationRun);
}

export async function attachPaypalOrderService(bookingId: string, orderId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const booking = await getBookingService(bookingId);
  if (!booking) {
    return null;
  }

  const bookingUpdate = await supabase
    .from("app_bookings")
    .update({
      paypal_order_id: orderId,
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId);

  if (bookingUpdate.error) {
    throw new Error(`No se pudo adjuntar orden PayPal: ${bookingUpdate.error.message}`);
  }

  const depositPayment = await supabase
    .from("app_payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("payment_type", "deposit")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (depositPayment.error) {
    throw new Error(`No se pudo consultar pago depósito: ${depositPayment.error.message}`);
  }

  if (depositPayment.data) {
    const paymentUpdate = await supabase
      .from("app_payments")
      .update({
        paypal_order_id: orderId,
        status: "processing"
      })
      .eq("id", depositPayment.data.id);

    if (paymentUpdate.error) {
      throw new Error(`No se pudo actualizar pago depósito: ${paymentUpdate.error.message}`);
    }
  }

  return getBookingService(bookingId);
}

export async function markBookingPaidByOrderService(orderId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const bookingResult = await supabase
    .from("app_bookings")
    .select("*")
    .eq("paypal_order_id", orderId)
    .maybeSingle<AppBookingRow>();

  if (bookingResult.error) {
    throw new Error(`No se pudo reconciliar orden PayPal: ${bookingResult.error.message}`);
  }
  if (!bookingResult.data) {
    return null;
  }

  const booking = mapBooking(bookingResult.data);

  const depositPaymentResult = await supabase
    .from("app_payments")
    .select("*")
    .eq("booking_id", booking.id)
    .or(`paypal_order_id.eq.${orderId},payment_type.eq.deposit`)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<AppPaymentRow>();

  if (depositPaymentResult.error) {
    throw new Error(`No se pudo consultar pago depósito: ${depositPaymentResult.error.message}`);
  }

  if (depositPaymentResult.data) {
    const paymentUpdate = await supabase
      .from("app_payments")
      .update({
        paypal_order_id: orderId,
        status: "paid",
        paid_at: new Date().toISOString()
      })
      .eq("id", depositPaymentResult.data.id);

    if (paymentUpdate.error) {
      throw new Error(`No se pudo confirmar pago depósito: ${paymentUpdate.error.message}`);
    }
  }

  const payments = await listPaymentsByBookingId(booking.id);
  const pendingCount = payments.filter((payment) => payment.status !== "paid").length;
  const paidCount = payments.length - pendingCount;

  let nextStage: BookingStage = "deposito_pagado";
  if (pendingCount === 0) {
    nextStage = "pagado_total";
  } else if (paidCount > 1) {
    nextStage = "pagado_parcial";
  }

  const bookingUpdate = await supabase
    .from("app_bookings")
    .update({
      status: nextStage,
      updated_at: new Date().toISOString()
    })
    .eq("id", booking.id)
    .select("*")
    .single<AppBookingRow>();

  if (bookingUpdate.error || !bookingUpdate.data) {
    throw new Error(`No se pudo actualizar estado de reserva: ${bookingUpdate.error?.message ?? "sin datos"}`);
  }

  await Promise.all([
    updateCustomerPipeline(booking.customerId, nextStage),
    queueAutomations("payment.due_soon", "payment", booking.id, booking.customerEmail, 7)
  ]);

  return mapBooking(bookingUpdate.data);
}

export async function getDashboardSnapshotService(): Promise<ReportSnapshot> {
  const [payments, bookings] = await Promise.all([listPaymentsService(), listBookingsService()]);
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const pendingPayments = payments.filter((payment) => payment.status !== "paid");

  const totalRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidBookings = bookings.filter((booking) =>
    ["deposito_pagado", "pagado_parcial", "pagado_total", "completado"].includes(booking.status)
  ).length;
  const conversionRate = bookings.length > 0 ? (paidBookings / bookings.length) * 100 : 0;

  return {
    totalRevenue,
    pendingAmount,
    paidBookings,
    conversionRate
  };
}

export async function getPipelineSummaryService() {
  const base: Record<BookingStage, number> = {
    lead: 0,
    contactado: 0,
    reservado: 0,
    deposito_pagado: 0,
    pagado_parcial: 0,
    pagado_total: 0,
    completado: 0,
    cancelado: 0
  };

  const bookings = await listBookingsService();
  for (const booking of bookings) {
    base[booking.status] += 1;
  }

  return base;
}

export async function getTripRevenueRowsService() {
  const [bookings, tripsResult] = await Promise.all([
    listBookingsService(),
    hasSupabaseConfig()
      ? getSupabaseAdminClient()
          .from("app_trips")
          .select("slug,title")
          .returns<Array<{ slug: string; title: string }>>()
      : Promise.resolve({ data: [] as Array<{ slug: string; title: string }>, error: null })
  ]);

  if (tripsResult.error) {
    throw new Error(`No se pudo cargar catálogo de viajes: ${tripsResult.error.message}`);
  }

  const titleBySlug = new Map((tripsResult.data ?? []).map((row) => [row.slug, row.title]));
  const rowMap = new Map<string, { tripSlug: string; tripTitle: string; revenue: number; bookings: number }>();

  for (const booking of bookings) {
    const existing = rowMap.get(booking.tripSlug);
    if (existing) {
      existing.revenue += booking.totalAmount;
      existing.bookings += 1;
      continue;
    }

    rowMap.set(booking.tripSlug, {
      tripSlug: booking.tripSlug,
      tripTitle: titleBySlug.get(booking.tripSlug) ?? booking.tripSlug,
      revenue: booking.totalAmount,
      bookings: 1
    });
  }

  return [...rowMap.values()];
}

export async function getPortalBundleService(email?: string): Promise<PortalBundle> {
  const customers = await listCustomersService();
  const normalizedEmail = email ? normalizeEmail(email) : undefined;
  const customer = normalizedEmail
    ? customers.find((item) => normalizeEmail(item.email) === normalizedEmail)
    : customers[0];

  if (!customer) {
    return {
      customer: null,
      bookings: [],
      payments: [],
      documents: []
    };
  }

  const bookings = (await listBookingsService()).filter((booking) => booking.customerId === customer.id);
  const bookingIds = new Set(bookings.map((booking) => booking.id));
  const payments = (await listPaymentsService()).filter((payment) => bookingIds.has(payment.bookingId));
  const documents = (await listDocumentsService()).filter(
    (document) =>
      (document.entityType === "customer" && document.entityId === customer.id) ||
      (document.entityType === "booking" && bookingIds.has(document.entityId))
  );

  return {
    customer,
    bookings,
    payments,
    documents
  };
}

export async function createCustomTripRequestService(input: CreateCustomTripRequestInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  await getOrCreateCustomerByEmail({
    fullName: input.customerName,
    email: input.customerEmail,
    pipelineStage: "lead"
  });

  const now = new Date().toISOString();
  const insert = await supabase
    .from("app_custom_trip_requests")
    .insert({
      customer_name: input.customerName.trim(),
      customer_email: normalizeEmail(input.customerEmail),
      destination: input.destination.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      travelers: input.travelers,
      budget: input.budget,
      motive: input.motive.trim(),
      expectations: input.expectations.trim(),
      status: "submitted",
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single<AppCustomTripRequestRow>();

  if (insert.error || !insert.data) {
    throw new Error(`No se pudo crear solicitud: ${insert.error?.message ?? "sin datos"}`);
  }

  return mapCustomRequest(insert.data);
}

export async function listCustomTripRequestsService() {
  if (!hasSupabaseConfig()) {
    return [] as CustomTripRequest[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_custom_trip_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<AppCustomTripRequestRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar solicitudes: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapCustomRequest);
}

export async function getCustomTripRequestService(requestId: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_custom_trip_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<AppCustomTripRequestRow>();

  if (result.error) {
    throw new Error(`No se pudo cargar solicitud: ${result.error.message}`);
  }

  return result.data ? mapCustomRequest(result.data) : null;
}

export async function markCustomRequestReviewingService(requestId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_custom_trip_requests")
    .update({
      status: "reviewing",
      updated_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .select("*")
    .maybeSingle<AppCustomTripRequestRow>();

  if (result.error) {
    throw new Error(`No se pudo actualizar solicitud: ${result.error.message}`);
  }

  return result.data ? mapCustomRequest(result.data) : null;
}

export async function createCustomProposalService(requestId: string, input: CreateCustomProposalInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const request = await getCustomTripRequestService(requestId);
  if (!request) {
    throw new Error("Solicitud personalizada no encontrada");
  }

  const previous = await supabase
    .from("app_custom_package_proposals")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<AppCustomPackageProposalRow>();

  if (previous.error) {
    throw new Error(`No se pudo consultar propuesta previa: ${previous.error.message}`);
  }

  const revision = (previous.data?.revision ?? 0) + 1;
  const now = new Date().toISOString();

  const proposal = await supabase
    .from("app_custom_package_proposals")
    .upsert(
      {
        request_id: requestId,
        title: input.title.trim(),
        summary: input.summary.trim(),
        itinerary: input.itinerary.map((item) => item.trim()).filter(Boolean),
        includes: input.includes.map((item) => item.trim()).filter(Boolean),
        excludes: input.excludes.map((item) => item.trim()).filter(Boolean),
        price_per_person: input.pricePerPerson,
        deposit: input.deposit,
        payment_plan: input.paymentPlan.trim(),
        notes: input.notes.trim(),
        pdf_url: input.pdfUrl,
        page_url: input.pageUrl,
        revision,
        updated_at: now
      },
      { onConflict: "request_id" }
    )
    .select("*")
    .single<AppCustomPackageProposalRow>();

  if (proposal.error || !proposal.data) {
    throw new Error(`No se pudo guardar propuesta: ${proposal.error?.message ?? "sin datos"}`);
  }

  const requestUpdate = await supabase
    .from("app_custom_trip_requests")
    .update({
      status: "package_ready",
      updated_at: now
    })
    .eq("id", requestId);

  if (requestUpdate.error) {
    throw new Error(`No se pudo actualizar estado de solicitud: ${requestUpdate.error.message}`);
  }

  return mapCustomProposal(proposal.data);
}

export async function getCustomProposalByRequestIdService(requestId: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_custom_package_proposals")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<AppCustomPackageProposalRow>();

  if (result.error) {
    throw new Error(`No se pudo cargar propuesta: ${result.error.message}`);
  }

  return result.data ? mapCustomProposal(result.data) : null;
}

export async function respondCustomProposalService(
  requestId: string,
  action: "accept" | "changes",
  message: string
) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const request = await getCustomTripRequestService(requestId);
  if (!request) {
    throw new Error("Solicitud no encontrada");
  }

  const proposal = await getCustomProposalByRequestIdService(requestId);
  if (!proposal) {
    throw new Error("Aún no hay paquete listo");
  }

  const responseInsert = await supabase
    .from("app_client_proposal_responses")
    .insert({
      request_id: requestId,
      action,
      message: message.trim()
    })
    .select("*")
    .single<AppClientProposalResponseRow>();

  if (responseInsert.error || !responseInsert.data) {
    throw new Error(`No se pudo guardar respuesta del cliente: ${responseInsert.error?.message ?? "sin datos"}`);
  }

  const nextStatus: CustomRequestStatus = action === "accept" ? "accepted" : "changes_requested";
  const requestUpdate = await supabase
    .from("app_custom_trip_requests")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .select("*")
    .single<AppCustomTripRequestRow>();

  if (requestUpdate.error || !requestUpdate.data) {
    throw new Error(`No se pudo actualizar estado de solicitud: ${requestUpdate.error?.message ?? "sin datos"}`);
  }

  return {
    request: mapCustomRequest(requestUpdate.data),
    proposal,
    response: mapClientProposalResponse(responseInsert.data)
  };
}

export async function listCustomProposalResponsesService(requestId?: string) {
  if (!hasSupabaseConfig()) {
    return [] as ClientProposalResponse[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_client_proposal_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (requestId) {
    query = query.eq("request_id", requestId);
  }

  const result = await query.returns<AppClientProposalResponseRow[]>();
  if (result.error) {
    throw new Error(`No se pudieron cargar respuestas: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapClientProposalResponse);
}

export async function appendEmailLogService(log: EmailLog) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_email_logs")
    .insert({
      id: log.id,
      recipient: normalizeEmail(log.to),
      subject: log.subject,
      body_preview: log.bodyPreview,
      provider: log.provider,
      sent_at: log.sentAt
    });

  if (result.error) {
    throw new Error(`No se pudo guardar log de email: ${result.error.message}`);
  }
}

export async function listEmailLogsService() {
  if (!hasSupabaseConfig()) {
    return [] as EmailLog[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .returns<AppEmailLogRow[]>();

  if (result.error) {
    throw new Error(`No se pudieron cargar logs de email: ${result.error.message}`);
  }

  return (result.data ?? []).map(mapEmailLog);
}

export async function getCustomRequestBundleService(requestId: string) {
  const [request, proposal, responses] = await Promise.all([
    getCustomTripRequestService(requestId),
    getCustomProposalByRequestIdService(requestId),
    listCustomProposalResponsesService(requestId)
  ]);

  return { request, proposal, responses };
}
