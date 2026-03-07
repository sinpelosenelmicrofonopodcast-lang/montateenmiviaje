export type TravelSearchType = "flights" | "hotels";
export type TravelCabinClass = "economy" | "premium_economy" | "business" | "first";
export type TravelCurrency = "USD" | "EUR" | "GBP" | "CAD" | "MXN";

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  oneWay: boolean;
  adults: number;
  children: number;
  infants: number;
  cabinClass: TravelCabinClass;
  includeBags?: boolean;
  directOnly?: boolean;
  airline?: string;
  minPrice?: number;
  maxPrice?: number;
  currency: TravelCurrency;
  flexibleDates?: boolean;
}

export interface HotelSearchInput {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  hotelName?: string;
  stars?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  neighborhood?: string;
  flexibleCancellation?: boolean;
  breakfastIncluded?: boolean;
  currency: TravelCurrency;
}

export interface NormalizedFlightOffer {
  id: string;
  provider: string;
  airline: string;
  flightNumber: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  originAirport: string;
  destinationAirport: string;
  baggage?: string;
  direct: boolean;
  cabinClass: TravelCabinClass;
  currency: TravelCurrency;
  basePrice: number;
  taxes: number;
  totalPrice: number;
  expiresAt?: string;
  raw: unknown;
}

export interface NormalizedHotelOffer {
  id: string;
  provider: string;
  hotelName: string;
  mainImage?: string;
  address: string;
  stars: number;
  rating?: number;
  roomType: string;
  mealPlan?: string;
  cancellationPolicy?: string;
  amenities: string[];
  neighborhood?: string;
  currency: TravelCurrency;
  pricePerNight: number;
  taxes: number;
  totalPrice: number;
  expiresAt?: string;
  raw: unknown;
}

export interface TravelSearchSession {
  id: string;
  createdBy?: string;
  searchType: TravelSearchType;
  origin?: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  departureDate?: string;
  returnDate?: string;
  passengers: Record<string, unknown>;
  filters: Record<string, unknown>;
  providerSources: string[];
  rawRequest: Record<string, unknown>;
  results: unknown[];
  resultCount: number;
  createdAt: string;
}

export type TravelQuoteStatus = "draft" | "sent" | "approved" | "expired" | "cancelled";
export type TravelPackageStatus = "draft" | "internal" | "ready" | "archived";
export type TravelPdfStatus = "generated" | "failed";
export type TravelItemType = "flight" | "hotel" | "transfer" | "activity" | "insurance" | "fee" | "manual";

export interface TravelQuoteItem {
  id: string;
  quoteId: string;
  itemType: TravelItemType;
  providerName?: string;
  externalOfferId?: string;
  title: string;
  summary: Record<string, unknown>;
  raw: Record<string, unknown>;
  basePrice: number;
  taxes: number;
  markup: number;
  fees: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
  createdAt: string;
}

export interface TravelQuote {
  id: string;
  quoteNumber: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  currency: TravelCurrency | string;
  status: TravelQuoteStatus;
  subtotal: number;
  taxesTotal: number;
  markupTotal: number;
  feesTotal: number;
  discountTotal: number;
  grandTotal: number;
  notesInternal?: string;
  notesClient?: string;
  expiresAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: TravelQuoteItem[];
}

export interface TravelPackageItem {
  id: string;
  packageId: string;
  itemType: TravelItemType;
  sourceQuoteItemId?: string;
  title: string;
  summary: Record<string, unknown>;
  raw: Record<string, unknown>;
  basePrice: number;
  taxes: number;
  markup: number;
  fees: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
  createdAt: string;
}

export interface TravelPackage {
  id: string;
  packageName: string;
  destination: string;
  status: TravelPackageStatus;
  visibility: "internal" | "private";
  startDate?: string;
  endDate?: string;
  baseQuoteId?: string;
  linkedTripSlug?: string;
  notes?: string;
  tags: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: TravelPackageItem[];
}

export interface TravelPdfExport {
  id: string;
  relatedType: "quote" | "package" | "summary";
  relatedId: string;
  filePath: string;
  fileName: string;
  status: TravelPdfStatus;
  errorMessage?: string;
  generatedBy?: string;
  createdAt: string;
}

export interface TravelAuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type TravelPermission =
  | "search_travel"
  | "manage_quotes"
  | "manage_packages"
  | "export_pdfs"
  | "attach_to_package"
  | "view_travel_history";

export interface TravelDashboardSnapshot {
  searches24h: number;
  draftQuotes: number;
  activeQuotes: number;
  packagesReady: number;
  exportsCount: number;
}

export interface CreateTravelQuoteItemInput {
  itemType: TravelItemType;
  providerName?: string;
  externalOfferId?: string;
  title: string;
  summary?: Record<string, unknown>;
  raw?: Record<string, unknown>;
  basePrice: number;
  taxes?: number;
  markup?: number;
  fees?: number;
  discount?: number;
  sortOrder?: number;
}

export interface CreateTravelQuoteInput {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  currency?: TravelCurrency | string;
  status?: TravelQuoteStatus;
  notesInternal?: string;
  notesClient?: string;
  expiresAt?: string;
  feesTotal?: number;
  markupTotal?: number;
  taxesTotal?: number;
  discountTotal?: number;
  items: CreateTravelQuoteItemInput[];
}

export interface CreateTravelPackageItemInput {
  itemType: TravelItemType;
  sourceQuoteItemId?: string;
  title: string;
  summary?: Record<string, unknown>;
  raw?: Record<string, unknown>;
  basePrice: number;
  taxes?: number;
  markup?: number;
  fees?: number;
  discount?: number;
  sortOrder?: number;
}

export interface CreateTravelPackageInput {
  packageName: string;
  destination: string;
  status?: TravelPackageStatus;
  visibility?: "internal" | "private";
  startDate?: string;
  endDate?: string;
  baseQuoteId?: string;
  linkedTripSlug?: string;
  notes?: string;
  tags?: string[];
  items?: CreateTravelPackageItemInput[];
}
