export type TripCategory = "Luxury" | "Adventure" | "Family" | "Romantic" | "Budget";
export type RoomType = "single" | "doble" | "triple";
export type BookingStage =
  | "lead"
  | "contactado"
  | "reservado"
  | "deposito_pagado"
  | "pagado_parcial"
  | "pagado_total"
  | "completado"
  | "cancelado";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded" | "overdue";

export interface TripDay {
  dayNumber: number;
  title: string;
  description: string;
  mapPin?: string;
}

export interface TripPackage {
  id: string;
  roomType: RoomType;
  pricePerPerson: number;
  deposit: number;
  paymentPlan: string;
}

export interface Trip {
  id: string;
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
  includes: string[];
  excludes: string[];
  policies: string[];
  requirements: string[];
  itinerary: TripDay[];
  packages: TripPackage[];
  addons: { id: string; name: string; price: number }[];
  hotels?: string[];
}

export interface Testimonial {
  id: string;
  customerName: string;
  tripTitle: string;
  quote: string;
  rating: number;
  verified: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  isRegistered: boolean;
  phone?: string;
  country?: string;
  preferences: string[];
  notes: string[];
  pipelineStage: BookingStage;
  tags: string[];
}

export interface BookingRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  tripSlug: string;
  roomType: RoomType;
  travelers: number;
  amount: number;
  totalAmount: number;
  balanceAmount: number;
  status: BookingStage;
  paypalOrderId?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerEmail: string;
  tripSlug: string;
  amount: number;
  currency: "USD";
  paymentType: "deposit" | "installment" | "balance" | "addon";
  dueDate?: string;
  paidAt?: string;
  status: PaymentStatus;
  paypalOrderId?: string;
}

export interface DocumentRecord {
  id: string;
  entityType: "trip" | "booking" | "customer";
  entityId: string;
  title: string;
  language: "es" | "en";
  audience: "client" | "internal";
  includePrices: boolean;
  createdAt: string;
  downloadUrl: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string;
  channel: "email" | "whatsapp";
  active: boolean;
}

export interface AutomationRun {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: "email" | "whatsapp";
  recipient: string;
  entityType: "booking" | "payment" | "trip";
  entityId: string;
  status: "queued" | "sent";
  scheduledAt: string;
}

export interface GalleryAlbum {
  id: string;
  tripSlug: string;
  title: string;
  coverImage: string;
  featured: boolean;
}

export interface GalleryMedia {
  id: string;
  albumId: string;
  type: "photo" | "video";
  url: string;
  caption: string;
}

export interface ReportSnapshot {
  totalRevenue: number;
  pendingAmount: number;
  paidBookings: number;
  conversionRate: number;
}

export type CustomRequestStatus =
  | "submitted"
  | "reviewing"
  | "package_ready"
  | "accepted"
  | "changes_requested";

export interface CustomTripRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  motive: string;
  expectations: string;
  status: CustomRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPackageProposal {
  id: string;
  requestId: string;
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
  revision: number;
  createdAt: string;
}

export interface ClientProposalResponse {
  id: string;
  requestId: string;
  action: "accept" | "changes";
  message: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodyPreview: string;
  sentAt: string;
  provider: "resend" | "simulated";
}

export type RaffleStatus = "draft" | "published" | "closed";
export type RaffleEntryStatus = "pending_payment" | "pending_review" | "confirmed" | "rejected";

export interface Raffle {
  id: string;
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
  winnerEntryId?: string;
  winnerNumber?: number;
  winnerCustomerEmail?: string;
  drawnAt?: string;
  status: RaffleStatus;
  createdAt: string;
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  customerId: string;
  customerEmail: string;
  chosenNumber: number;
  paymentReference?: string;
  note?: string;
  status: RaffleEntryStatus;
  createdAt: string;
}
