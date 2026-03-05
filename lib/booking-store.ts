import { randomUUID } from "crypto";
import { addDays, addMonths } from "@/lib/date-utils";
import { automationRules, getPackageByRoom, getTripBySlug, trips } from "@/lib/data";
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
  Raffle,
  RaffleEntry,
  RaffleEntryStatus,
  ReportSnapshot,
  RoomType
} from "@/lib/types";

interface AppState {
  bookings: Map<string, BookingRecord>;
  customers: Map<string, Customer>;
  payments: Map<string, PaymentRecord>;
  documents: Map<string, DocumentRecord>;
  automationRuns: AutomationRun[];
  customRequests: Map<string, CustomTripRequest>;
  customProposals: Map<string, CustomPackageProposal>;
  clientProposalResponses: ClientProposalResponse[];
  emailLogs: EmailLog[];
  raffles: Map<string, Raffle>;
  raffleEntries: Map<string, RaffleEntry>;
}

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

export interface RegisterCustomerInput {
  fullName: string;
  email: string;
}

export interface CreateRaffleInput {
  title: string;
  description: string;
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
}

export interface DrawRaffleWinnerResult {
  raffle: Raffle;
  winnerEntry: RaffleEntry | null;
}

const globalForState = globalThis as typeof globalThis & {
  __montateState?: AppState;
};

function buildInitialState(): AppState {
  const state: AppState = {
    bookings: new Map<string, BookingRecord>(),
    customers: new Map<string, Customer>(),
    payments: new Map<string, PaymentRecord>(),
    documents: new Map<string, DocumentRecord>(),
    automationRuns: [],
    customRequests: new Map<string, CustomTripRequest>(),
    customProposals: new Map<string, CustomPackageProposal>(),
    clientProposalResponses: [],
    emailLogs: [],
    raffles: new Map<string, Raffle>(),
    raffleEntries: new Map<string, RaffleEntry>()
  };

  const seeded = createBookingInState(state, {
    customerName: "Laura Mendoza",
    customerEmail: "laura@cliente.com",
    tripSlug: "dubai-signature",
    roomType: "doble",
    travelers: 1,
    depositAmount: 500
  });

  const depositPayment = listPaymentsByBookingInState(state, seeded.id).find(
    (payment) => payment.paymentType === "deposit"
  );
  if (depositPayment) {
    depositPayment.status = "paid";
    depositPayment.paidAt = new Date().toISOString();
    state.payments.set(depositPayment.id, depositPayment);
    seeded.status = "deposito_pagado";
    state.bookings.set(seeded.id, seeded);
  }

  const seededRequest = createCustomTripRequestInState(state, {
    customerName: "Diego Rivera",
    customerEmail: "diego@cliente.com",
    destination: "Tokio, Japón",
    startDate: "2026-11-10",
    endDate: "2026-11-18",
    travelers: 4,
    budget: 12000,
    motive: "Cumpleaños de 40",
    expectations: "Hoteles premium, experiencia gastronómica y agenda flexible."
  });

  createCustomProposalInState(state, seededRequest.id, {
    title: "Tokio Birthday Concierge",
    summary: "Experiencia premium de 8 días con hotel 5* en Shinjuku, city concierge y cenas privadas.",
    itinerary: [
      "Día 1: Llegada y transfer privado + welcome dinner.",
      "Día 2: Tour privado Tokio clásico + sesión fotográfica.",
      "Día 3: Excursión a Hakone con ryokan experience.",
      "Día 4: Shibuya/Omotesando + shopping concierge."
    ],
    includes: [
      "Hotel 5 estrellas",
      "Traslados privados",
      "4 experiencias premium",
      "Asistencia 24/7 en destino"
    ],
    excludes: ["Vuelos internacionales", "Seguro de viaje", "Gastos personales"],
    pricePerPerson: 3450,
    deposit: 900,
    paymentPlan: "Depósito + 3 cuotas mensuales",
    notes: "Se puede ajustar categoría de hotel y ritmo de itinerario.",
    pdfUrl: "/api/pdf/trip/dubai-signature?audience=client&lang=es&showPrices=true",
    pageUrl: `/propuesta/${seededRequest.id}`
  });

  registerCustomerInState(state, { fullName: "Laura Mendoza", email: "laura@cliente.com" });
  registerCustomerInState(state, { fullName: "Diego Rivera", email: "diego@cliente.com" });

  const raffleStartDate = addDays(new Date(), -7).toISOString().slice(0, 10);
  const raffleEndDate = addDays(new Date(), 21).toISOString().slice(0, 10);
  const raffleDrawAt = addDays(new Date(), 22).toISOString();
  const paidRaffleStartDate = addDays(new Date(), -5).toISOString().slice(0, 10);
  const paidRaffleEndDate = addDays(new Date(), 15).toISOString().slice(0, 10);
  const paidRaffleDrawAt = addDays(new Date(), 16).toISOString();

  const giveaway = createRaffleInState(state, {
    title: "Sorteo Gratis: Escapada a Cartagena",
    description: "Participa por 2 cupos para una escapada premium de fin de semana.",
    isFree: true,
    entryFee: 0,
    paymentInstructions: "No requiere pago.",
    requirements: "Seguir la marca y estar registrado en la plataforma.",
    prize: "2 cupos Cartagena All-Inclusive",
    startDate: raffleStartDate,
    endDate: raffleEndDate,
    drawAt: raffleDrawAt,
    numberPoolSize: 100,
    status: "published"
  });

  const paidRaffle = createRaffleInState(state, {
    title: "Rifa VIP: Dubai Signature Slot",
    description: "Rifa de 1 cupo VIP para Dubai Signature Week.",
    isFree: false,
    entryFee: 25,
    paymentInstructions:
      "Enviar USD 25 por PayPal a pagos@montateenmiviaje.com y colocar el ID de referencia.",
    requirements: "Ser mayor de edad, usuario registrado y pago confirmado.",
    prize: "1 cupo VIP en Dubai Signature Week",
    startDate: paidRaffleStartDate,
    endDate: paidRaffleEndDate,
    drawAt: paidRaffleDrawAt,
    numberPoolSize: 75,
    status: "published"
  });

  createRaffleEntryInState(state, giveaway.id, "laura@cliente.com", 7, "Quiero participar");
  const paidEntry = createRaffleEntryInState(
    state,
    paidRaffle.id,
    "diego@cliente.com",
    18,
    "Pago enviado",
    "PAYPAL-ABC-123"
  );
  paidEntry.status = "confirmed";
  state.raffleEntries.set(paidEntry.id, paidEntry);

  return state;
}

function getState() {
  if (!globalForState.__montateState) {
    globalForState.__montateState = buildInitialState();
  }

  return globalForState.__montateState;
}

function parseInstallmentCount(paymentPlan: string) {
  const match = paymentPlan.match(/(\d+)\s*cuotas/i);
  const count = match ? Number(match[1]) : 2;
  return Number.isFinite(count) && count > 0 ? count : 2;
}

function getOrCreateCustomer(state: AppState, fullName: string, email: string) {
  const existing = [...state.customers.values()].find((customer) => customer.email === email);
  if (existing) {
    return existing;
  }

  const customer: Customer = {
    id: randomUUID(),
    fullName,
    email,
    isRegistered: false,
    preferences: ["premium", "grupo"],
    notes: ["Nuevo lead convertido desde website"],
    pipelineStage: "reservado",
    tags: ["new"]
  };

  state.customers.set(customer.id, customer);
  return customer;
}

function registerCustomerInState(state: AppState, input: RegisterCustomerInput) {
  const customer = getOrCreateCustomer(state, input.fullName, input.email);
  customer.isRegistered = true;
  if (!customer.tags.includes("registered")) {
    customer.tags.push("registered");
  }
  if (!customer.notes.includes("Registro completado para funciones premium.")) {
    customer.notes.push("Registro completado para funciones premium.");
  }
  state.customers.set(customer.id, customer);
  return customer;
}

function findRegisteredCustomerByEmailInState(state: AppState, email: string) {
  const customer = [...state.customers.values()].find((item) => item.email === email);
  if (!customer || !customer.isRegistered) {
    return null;
  }

  return customer;
}

function queueAutomations(
  state: AppState,
  event: string,
  entityType: AutomationRun["entityType"],
  entityId: string,
  recipient: string,
  daysOffset = 0
) {
  const now = new Date();

  for (const rule of automationRules) {
    if (!rule.active || rule.triggerEvent !== event) {
      continue;
    }

    state.automationRuns.unshift({
      id: randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      channel: rule.channel,
      recipient,
      entityType,
      entityId,
      status: "queued",
      scheduledAt: addDays(now, daysOffset).toISOString()
    });
  }
}

function parseIsoDateTime(value: string, label: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} inválida`);
  }

  return parsed.toISOString();
}

function getRaffleEntriesInState(state: AppState, raffleId: string) {
  return [...state.raffleEntries.values()].filter((entry) => entry.raffleId === raffleId);
}

function getReservedRaffleNumbersInState(state: AppState, raffleId: string, excludedEntryId?: string) {
  const taken = new Set<number>();

  for (const entry of state.raffleEntries.values()) {
    if (entry.raffleId !== raffleId) {
      continue;
    }

    if (excludedEntryId && entry.id === excludedEntryId) {
      continue;
    }

    if (entry.status === "rejected") {
      continue;
    }

    taken.add(entry.chosenNumber);
  }

  return taken;
}

function getAvailableRaffleNumbersInState(state: AppState, raffle: Raffle) {
  const taken = getReservedRaffleNumbersInState(state, raffle.id);
  const numbers: number[] = [];

  for (let number = 1; number <= raffle.numberPoolSize; number += 1) {
    if (!taken.has(number)) {
      numbers.push(number);
    }
  }

  return numbers;
}

function drawRaffleWinnerInState(
  state: AppState,
  raffleId: string,
  options?: { force?: boolean }
): DrawRaffleWinnerResult {
  const raffle = state.raffles.get(raffleId);
  if (!raffle) {
    throw new Error("Sorteo no encontrado");
  }

  if (raffle.status === "draft") {
    throw new Error("El sorteo aún no está publicado");
  }

  if (raffle.drawnAt) {
    const winnerEntry = raffle.winnerEntryId ? state.raffleEntries.get(raffle.winnerEntryId) ?? null : null;
    return { raffle, winnerEntry };
  }

  const now = new Date();
  if (!options?.force && now.getTime() < new Date(raffle.drawAt).getTime()) {
    throw new Error("Aún no llega la hora del sorteo");
  }

  const eligibleEntries = getRaffleEntriesInState(state, raffle.id).filter(
    (entry) => entry.status === "confirmed"
  );

  raffle.status = "closed";
  raffle.drawnAt = now.toISOString();

  if (eligibleEntries.length === 0) {
    raffle.winnerEntryId = undefined;
    raffle.winnerNumber = undefined;
    raffle.winnerCustomerEmail = undefined;
    state.raffles.set(raffle.id, raffle);
    return { raffle, winnerEntry: null };
  }

  const winnerEntry = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];
  raffle.winnerEntryId = winnerEntry.id;
  raffle.winnerNumber = winnerEntry.chosenNumber;
  raffle.winnerCustomerEmail = winnerEntry.customerEmail;
  state.raffles.set(raffle.id, raffle);

  return { raffle, winnerEntry };
}

function runDueRaffleDrawsInState(state: AppState) {
  const now = Date.now();

  for (const raffle of state.raffles.values()) {
    if (raffle.status !== "published" || raffle.drawnAt) {
      continue;
    }

    const drawAt = new Date(raffle.drawAt).getTime();
    if (Number.isNaN(drawAt) || drawAt > now) {
      continue;
    }

    drawRaffleWinnerInState(state, raffle.id, { force: true });
  }
}

function createRaffleInState(state: AppState, input: CreateRaffleInput) {
  const startAt = new Date(input.startDate);
  const endAt = new Date(input.endDate);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Fechas del sorteo inválidas");
  }
  if (endAt.getTime() < startAt.getTime()) {
    throw new Error("La fecha de cierre no puede ser menor que la fecha de inicio");
  }

  const drawAt = parseIsoDateTime(input.drawAt, "Fecha de anuncio");
  if (new Date(drawAt).getTime() < endAt.getTime()) {
    throw new Error("La fecha de anuncio debe ser igual o posterior al cierre");
  }

  if (!Number.isInteger(input.numberPoolSize) || input.numberPoolSize < 1) {
    throw new Error("La cantidad de números debe ser mayor a 0");
  }

  const raffle: Raffle = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    isFree: input.isFree,
    entryFee: input.isFree ? 0 : input.entryFee,
    paymentInstructions: input.isFree ? "No requiere pago." : input.paymentInstructions,
    requirements: input.requirements,
    prize: input.prize,
    startDate: input.startDate,
    endDate: input.endDate,
    drawAt,
    numberPoolSize: input.numberPoolSize,
    status: input.status,
    createdAt: new Date().toISOString()
  };

  state.raffles.set(raffle.id, raffle);
  return raffle;
}

function createRaffleEntryInState(
  state: AppState,
  raffleId: string,
  customerEmail: string,
  chosenNumber: number,
  note?: string,
  paymentReference?: string
) {
  runDueRaffleDrawsInState(state);
  const raffle = state.raffles.get(raffleId);
  if (!raffle) {
    throw new Error("Sorteo no encontrado");
  }

  if (raffle.status !== "published") {
    throw new Error("Este sorteo no está disponible");
  }

  const now = Date.now();
  const startsAt = new Date(raffle.startDate).getTime();
  if (!Number.isNaN(startsAt) && now < startsAt) {
    throw new Error("El sorteo aún no inicia");
  }

  const drawAt = new Date(raffle.drawAt).getTime();
  if (!Number.isNaN(drawAt) && now >= drawAt) {
    throw new Error("El sorteo ya cerró participaciones");
  }

  if (!Number.isInteger(chosenNumber)) {
    throw new Error("Debes seleccionar un número válido");
  }
  if (chosenNumber < 1 || chosenNumber > raffle.numberPoolSize) {
    throw new Error(`El número debe estar entre 1 y ${raffle.numberPoolSize}`);
  }

  const customer = findRegisteredCustomerByEmailInState(state, customerEmail);
  if (!customer) {
    throw new Error("Debes estar registrado para participar");
  }

  const alreadyJoined = [...state.raffleEntries.values()].find(
    (entry) => entry.raffleId === raffleId && entry.customerId === customer.id
  );
  if (alreadyJoined) {
    throw new Error("Ya participas en este sorteo");
  }

  const takenNumbers = getReservedRaffleNumbersInState(state, raffleId);
  if (takenNumbers.has(chosenNumber)) {
    throw new Error("Ese número ya fue seleccionado por otro participante");
  }

  let status: RaffleEntryStatus;
  if (raffle.isFree) {
    status = "confirmed";
  } else {
    status = paymentReference ? "pending_review" : "pending_payment";
  }

  const entry: RaffleEntry = {
    id: randomUUID(),
    raffleId,
    customerId: customer.id,
    customerEmail: customer.email,
    chosenNumber,
    paymentReference,
    note,
    status,
    createdAt: new Date().toISOString()
  };

  state.raffleEntries.set(entry.id, entry);
  return entry;
}

function createBookingInState(state: AppState, input: CreateBookingInput) {
  const trip = getTripBySlug(input.tripSlug);
  if (!trip) {
    throw new Error("Viaje no encontrado");
  }

  const selectedPackage = getPackageByRoom(trip.packages, input.roomType);
  if (!selectedPackage) {
    throw new Error("Tipo de habitación inválido");
  }

  const totalAmount = selectedPackage.pricePerPerson * input.travelers;
  const expectedDeposit = selectedPackage.deposit * input.travelers;

  if (Math.abs(expectedDeposit - input.depositAmount) > 0.01) {
    throw new Error("Monto de depósito inválido");
  }

  const customer = getOrCreateCustomer(state, input.customerName, input.customerEmail);
  const booking: BookingRecord = {
    id: randomUUID(),
    customerId: customer.id,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    tripSlug: input.tripSlug,
    roomType: input.roomType,
    travelers: input.travelers,
    amount: input.depositAmount,
    totalAmount,
    balanceAmount: Math.max(totalAmount - input.depositAmount, 0),
    status: "reservado",
    createdAt: new Date().toISOString()
  };

  state.bookings.set(booking.id, booking);

  const depositPayment: PaymentRecord = {
    id: randomUUID(),
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
    tripSlug: booking.tripSlug,
    amount: booking.amount,
    currency: "USD",
    paymentType: "deposit",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "pending"
  };

  state.payments.set(depositPayment.id, depositPayment);

  if (booking.balanceAmount > 0) {
    const installments = parseInstallmentCount(selectedPackage.paymentPlan);
    const eachInstallment = Number((booking.balanceAmount / installments).toFixed(2));

    for (let index = 1; index <= installments; index += 1) {
      const payment: PaymentRecord = {
        id: randomUUID(),
        bookingId: booking.id,
        customerEmail: booking.customerEmail,
        tripSlug: booking.tripSlug,
        amount: eachInstallment,
        currency: "USD",
        paymentType: index === installments ? "balance" : "installment",
        dueDate: addMonths(new Date(), index).toISOString().slice(0, 10),
        status: "pending"
      };
      state.payments.set(payment.id, payment);
    }
  }

  queueAutomations(state, "booking.created", "booking", booking.id, booking.customerEmail);
  queueAutomations(state, "payment.due_soon", "payment", booking.id, booking.customerEmail, 14);
  queueAutomations(state, "trip.upcoming", "trip", trip.id, booking.customerEmail, 30);

  return booking;
}

function listPaymentsByBookingInState(state: AppState, bookingId: string) {
  return [...state.payments.values()].filter((payment) => payment.bookingId === bookingId);
}

export function createBooking(input: CreateBookingInput) {
  const state = getState();
  return createBookingInState(state, input);
}

export function getBooking(id: string) {
  return getState().bookings.get(id);
}

export function listBookings() {
  return [...getState().bookings.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listPayments() {
  return [...getState().payments.values()].sort((a, b) => {
    if (!a.dueDate || !b.dueDate) {
      return 0;
    }

    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function listCustomers() {
  const state = getState();
  const bookings = listBookings();

  return [...state.customers.values()].map((customer) => {
    const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);
    const lifetimeValue = customerBookings.reduce((acc, booking) => acc + booking.totalAmount, 0);

    return {
      ...customer,
      bookingsCount: customerBookings.length,
      lifetimeValue
    };
  });
}

export function listDocuments(entityType?: DocumentRecord["entityType"], entityId?: string) {
  return [...getState().documents.values()].filter((document) => {
    if (!entityType) {
      return true;
    }

    if (document.entityType !== entityType) {
      return false;
    }

    return entityId ? document.entityId === entityId : true;
  });
}

export function createDocumentRecord(input: Omit<DocumentRecord, "id" | "createdAt">) {
  const record: DocumentRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };

  getState().documents.set(record.id, record);
  return record;
}

export function listAutomationRuns() {
  return getState().automationRuns;
}

export function attachPaypalOrder(bookingId: string, orderId: string) {
  const state = getState();
  const booking = state.bookings.get(bookingId);
  if (!booking) {
    return;
  }

  booking.paypalOrderId = orderId;
  state.bookings.set(bookingId, booking);

  const depositPayment = listPaymentsByBookingInState(state, bookingId).find(
    (payment) => payment.paymentType === "deposit"
  );

  if (depositPayment) {
    depositPayment.paypalOrderId = orderId;
    depositPayment.status = "processing";
    state.payments.set(depositPayment.id, depositPayment);
  }
}

export function markBookingPaidByOrder(orderId: string) {
  const state = getState();

  for (const booking of state.bookings.values()) {
    if (booking.paypalOrderId !== orderId) {
      continue;
    }

    booking.status = "deposito_pagado";
    state.bookings.set(booking.id, booking);

    const depositPayment = listPaymentsByBookingInState(state, booking.id).find(
      (payment) => payment.paypalOrderId === orderId
    );

    if (depositPayment) {
      depositPayment.status = "paid";
      depositPayment.paidAt = new Date().toISOString();
      state.payments.set(depositPayment.id, depositPayment);
    }

    const pending = listPaymentsByBookingInState(state, booking.id).filter(
      (payment) => payment.status !== "paid"
    );

    if (pending.length === 0) {
      booking.status = "pagado_total";
      state.bookings.set(booking.id, booking);
    }

    queueAutomations(state, "payment.due_soon", "payment", booking.id, booking.customerEmail, 7);

    return booking;
  }

  return null;
}

export function updateBookingStage(bookingId: string, stage: BookingStage) {
  const state = getState();
  const booking = state.bookings.get(bookingId);
  if (!booking) {
    return null;
  }

  booking.status = stage;
  state.bookings.set(booking.id, booking);
  return booking;
}

export function getDashboardSnapshot(): ReportSnapshot {
  const payments = listPayments();
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const pendingPayments = payments.filter((payment) => payment.status !== "paid");

  const totalRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const bookings = listBookings();
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

export function getPipelineSummary() {
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

  for (const booking of listBookings()) {
    base[booking.status] += 1;
  }

  return base;
}

export function getTripRevenueRows() {
  const rows = trips.map((trip) => ({
    tripSlug: trip.slug,
    tripTitle: trip.title,
    revenue: 0,
    bookings: 0
  }));

  const rowMap = new Map(rows.map((row) => [row.tripSlug, row]));

  for (const booking of listBookings()) {
    const row = rowMap.get(booking.tripSlug);
    if (!row) {
      continue;
    }

    row.revenue += booking.totalAmount;
    row.bookings += 1;
  }

  return rows;
}

export function getPortalBundle(email?: string) {
  const customers = listCustomers();
  const customer = email
    ? customers.find((item) => item.email === email)
    : customers[0];

  if (!customer) {
    return {
      customer: null,
      bookings: [],
      payments: [],
      documents: []
    };
  }

  const bookings = listBookings().filter((booking) => booking.customerId === customer.id);
  const bookingIds = new Set(bookings.map((booking) => booking.id));
  const payments = listPayments().filter((payment) => bookingIds.has(payment.bookingId));
  const documents = listDocuments().filter(
    (document) =>
      (document.entityType === "customer" && document.entityId === customer.id) ||
      (document.entityType === "booking" && bookingIds.has(document.entityId))
  );

  return { customer, bookings, payments, documents };
}

function createCustomTripRequestInState(state: AppState, input: CreateCustomTripRequestInput) {
  const now = new Date().toISOString();
  const request: CustomTripRequest = {
    id: randomUUID(),
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    travelers: input.travelers,
    budget: input.budget,
    motive: input.motive,
    expectations: input.expectations,
    status: "submitted",
    createdAt: now,
    updatedAt: now
  };

  state.customRequests.set(request.id, request);
  return request;
}

function createCustomProposalInState(
  state: AppState,
  requestId: string,
  input: CreateCustomProposalInput
) {
  const request = state.customRequests.get(requestId);
  if (!request) {
    throw new Error("Solicitud personalizada no encontrada");
  }

  const previous = state.customProposals.get(requestId);
  const proposal: CustomPackageProposal = {
    id: previous?.id ?? randomUUID(),
    requestId,
    title: input.title,
    summary: input.summary,
    itinerary: input.itinerary,
    includes: input.includes,
    excludes: input.excludes,
    pricePerPerson: input.pricePerPerson,
    deposit: input.deposit,
    paymentPlan: input.paymentPlan,
    notes: input.notes,
    pdfUrl: input.pdfUrl,
    pageUrl: input.pageUrl,
    revision: previous ? previous.revision + 1 : 1,
    createdAt: new Date().toISOString()
  };

  state.customProposals.set(requestId, proposal);
  request.status = "package_ready";
  request.updatedAt = new Date().toISOString();
  state.customRequests.set(request.id, request);

  return proposal;
}

function setCustomRequestStatusInState(state: AppState, requestId: string, status: CustomRequestStatus) {
  const request = state.customRequests.get(requestId);
  if (!request) {
    return null;
  }

  request.status = status;
  request.updatedAt = new Date().toISOString();
  state.customRequests.set(request.id, request);
  return request;
}

export function createCustomTripRequest(input: CreateCustomTripRequestInput) {
  return createCustomTripRequestInState(getState(), input);
}

export function listCustomTripRequests() {
  return [...getState().customRequests.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCustomTripRequest(requestId: string) {
  return getState().customRequests.get(requestId) ?? null;
}

export function markCustomRequestReviewing(requestId: string) {
  return setCustomRequestStatusInState(getState(), requestId, "reviewing");
}

export function createCustomProposal(requestId: string, input: CreateCustomProposalInput) {
  return createCustomProposalInState(getState(), requestId, input);
}

export function getCustomProposalByRequestId(requestId: string) {
  return getState().customProposals.get(requestId) ?? null;
}

export function respondCustomProposal(
  requestId: string,
  action: "accept" | "changes",
  message: string
) {
  const state = getState();
  const request = state.customRequests.get(requestId);
  if (!request) {
    throw new Error("Solicitud no encontrada");
  }

  const proposal = state.customProposals.get(requestId);
  if (!proposal) {
    throw new Error("Aún no hay paquete listo");
  }

  const response: ClientProposalResponse = {
    id: randomUUID(),
    requestId,
    action,
    message,
    createdAt: new Date().toISOString()
  };
  state.clientProposalResponses.unshift(response);

  request.status = action === "accept" ? "accepted" : "changes_requested";
  request.updatedAt = new Date().toISOString();
  state.customRequests.set(request.id, request);

  return { request, proposal, response };
}

export function listCustomProposalResponses(requestId?: string) {
  const responses = getState().clientProposalResponses;
  if (!requestId) {
    return responses;
  }

  return responses.filter((response) => response.requestId === requestId);
}

export function appendEmailLog(log: EmailLog) {
  const state = getState();
  state.emailLogs.unshift(log);
}

export function listEmailLogs() {
  return getState().emailLogs;
}

export function getCustomRequestBundle(requestId: string) {
  const request = getCustomTripRequest(requestId);
  const proposal = getCustomProposalByRequestId(requestId);
  const responses = listCustomProposalResponses(requestId);
  return { request, proposal, responses };
}

export function registerCustomer(input: RegisterCustomerInput) {
  return registerCustomerInState(getState(), input);
}

export function isRegisteredCustomer(email: string) {
  return !!findRegisteredCustomerByEmailInState(getState(), email);
}

export function createRaffle(input: CreateRaffleInput) {
  return createRaffleInState(getState(), input);
}

export function listRaffles(options?: { includeDrafts?: boolean; includeClosed?: boolean }) {
  const state = getState();
  runDueRaffleDrawsInState(state);
  const includeDrafts = options?.includeDrafts ?? false;
  const includeClosed = options?.includeClosed ?? false;
  const raffles = [...state.raffles.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (includeDrafts) {
    return raffles;
  }
  return raffles.filter((raffle) => raffle.status === "published" || (includeClosed && raffle.status === "closed"));
}

export function getRaffleById(raffleId: string) {
  const state = getState();
  runDueRaffleDrawsInState(state);
  return state.raffles.get(raffleId) ?? null;
}

export function enterRaffle(
  raffleId: string,
  customerEmail: string,
  chosenNumber: number,
  note?: string,
  paymentReference?: string
) {
  return createRaffleEntryInState(getState(), raffleId, customerEmail, chosenNumber, note, paymentReference);
}

export function listRaffleEntries(raffleId?: string) {
  const state = getState();
  runDueRaffleDrawsInState(state);
  const entries = [...state.raffleEntries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!raffleId) {
    return entries;
  }
  return entries.filter((entry) => entry.raffleId === raffleId);
}

export function listAvailableRaffleNumbers(raffleId: string) {
  const state = getState();
  runDueRaffleDrawsInState(state);
  const raffle = state.raffles.get(raffleId);
  if (!raffle) {
    return null;
  }

  return getAvailableRaffleNumbersInState(state, raffle);
}

export function updateRaffleEntryStatus(entryId: string, status: RaffleEntryStatus) {
  const state = getState();
  const entry = state.raffleEntries.get(entryId);
  if (!entry) {
    return null;
  }

  const raffle = state.raffles.get(entry.raffleId);
  if (!raffle) {
    return null;
  }

  if (raffle.drawnAt) {
    throw new Error("No se puede editar participaciones de un sorteo ya sorteado");
  }

  if (status !== "rejected") {
    const takenNumbers = getReservedRaffleNumbersInState(state, raffle.id, entry.id);
    if (takenNumbers.has(entry.chosenNumber)) {
      throw new Error("El número ya fue reasignado a otro participante");
    }
  }

  entry.status = status;
  state.raffleEntries.set(entry.id, entry);
  return entry;
}

export function updateRaffleStatus(raffleId: string, status: Raffle["status"]) {
  const state = getState();
  const raffle = state.raffles.get(raffleId);
  if (!raffle) {
    return null;
  }

  if (raffle.drawnAt && status === "published") {
    throw new Error("No se puede reabrir un sorteo ya sorteado");
  }

  raffle.status = status;
  state.raffles.set(raffle.id, raffle);

  if (status === "published") {
    runDueRaffleDrawsInState(state);
  }

  return raffle;
}

export function drawRaffleWinner(raffleId: string): DrawRaffleWinnerResult {
  return drawRaffleWinnerInState(getState(), raffleId, { force: true });
}
