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
  shortDescription?: string;
  longDescription?: string;
  durationDays?: number;
  galleryImages?: string[];
  publishStatus?: "draft" | "published" | "unpublished" | "sold_out" | "archived";
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  tripTitle: string;
  quote: string;
  rating: number;
  verified: boolean;
  approved?: boolean;
  city?: string;
  photoUrl?: string;
  videoUrl?: string;
  featured?: boolean;
  publishStatus?: "draft" | "published" | "archived";
}

export interface Customer {
  id: string;
  authUserId?: string;
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
  entityType: "trip" | "booking" | "customer" | "proposal";
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
  entityType: "booking" | "payment" | "trip" | "proposal";
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
  sortOrder?: number;
}

export interface ReportSnapshot {
  totalRevenue: number;
  pendingAmount: number;
  paidBookings: number;
  conversionRate: number;
}

export interface Offer {
  id: string;
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
  createdAt: string;
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
export type RaffleParticipantsMode = "hidden" | "name_only" | "name_number" | "masked";
export type RaffleNumberGridMode = "full" | "available_only" | "sold_only" | "totals_only";
export type RaffleVerificationMode = "none" | "commit_reveal";
export type RaffleDrawAlgorithm = "sha256-modulo-v1";
export type RaffleEntryStatus = "pending_payment" | "pending_review" | "confirmed" | "rejected" | "cancelled";
export type RaffleNumberStatus =
  | "available"
  | "blocked"
  | "reserved"
  | "pending_manual_review"
  | "sold"
  | "cancelled"
  | "winner";
export type RaffleEntrySource = "online" | "offline" | "admin_manual";
export type RaffleManualPaymentMethod = "paypal" | "zelle" | "cashapp" | "ath_movil" | "cash" | "venmo" | "other";

export interface Raffle {
  id: string;
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
  winnerEntryId?: string;
  winnerNumber?: number;
  winnerCustomerEmail?: string;
  drawnAt?: string;
  status: RaffleStatus;
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
  secretCommitHash?: string;
  drawAlgorithm?: RaffleDrawAlgorithm;
  drawPayloadJson?: Record<string, unknown>;
  referralEnabled?: boolean;
  viralCounterEnabled?: boolean;
  urgencyMessage?: string;
  publicActivityEnabled?: boolean;
  liveDrawEnabled?: boolean;
  updatedAt?: string;
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
  source?: RaffleEntrySource;
  publicDisplayName?: string;
  consentPublicListing?: boolean;
  paymentMethod?: string;
  phone?: string;
  referralCode?: string;
  referredByCode?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface RaffleNumber {
  id: string;
  raffleId: string;
  numberValue: number;
  status: RaffleNumberStatus;
  entryId?: string;
  customerId?: string;
  customerEmail?: string;
  source: RaffleEntrySource;
  assignedOffline: boolean;
  paymentMethod?: string;
  adminNote?: string;
  blockedReason?: string;
  blockedBy?: string;
  blockedAt?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RafflePayment {
  id: string;
  raffleId: string;
  entryId?: string;
  customerId?: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  paymentMethod: RaffleManualPaymentMethod;
  paymentReference?: string;
  screenshotUrl?: string;
  isManual: boolean;
  manuallyVerified: boolean;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicRaffleParticipant {
  entryId: string;
  displayName: string;
  chosenNumber?: number;
  status: RaffleEntryStatus;
  createdAt: string;
  source: RaffleEntrySource;
}
