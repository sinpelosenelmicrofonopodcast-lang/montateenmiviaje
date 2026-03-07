import type { NormalizedHotelOffer, TravelCurrency } from "@/lib/travel/types";

export interface MockHotelRawOffer {
  id: string;
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
  pricePerNight: number;
  taxes: number;
  totalPrice: number;
  expiresAt?: string;
}

export function normalizeMockHotelOffer(
  raw: MockHotelRawOffer,
  provider: string,
  currency: TravelCurrency
): NormalizedHotelOffer {
  return {
    id: raw.id,
    provider,
    hotelName: raw.hotelName,
    mainImage: raw.mainImage,
    address: raw.address,
    stars: raw.stars,
    rating: raw.rating,
    roomType: raw.roomType,
    mealPlan: raw.mealPlan,
    cancellationPolicy: raw.cancellationPolicy,
    amenities: raw.amenities ?? [],
    neighborhood: raw.neighborhood,
    currency,
    pricePerNight: Number(raw.pricePerNight) || 0,
    taxes: Number(raw.taxes) || 0,
    totalPrice: Number(raw.totalPrice) || 0,
    expiresAt: raw.expiresAt,
    raw
  };
}
