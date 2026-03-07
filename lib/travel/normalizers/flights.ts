import type { NormalizedFlightOffer, TravelCabinClass, TravelCurrency } from "@/lib/travel/types";

export interface MockFlightRawOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  originAirport: string;
  destinationAirport: string;
  baggage?: string;
  basePrice: number;
  taxes: number;
  expiresAt?: string;
}

export function normalizeMockFlightOffer(
  raw: MockFlightRawOffer,
  provider: string,
  cabinClass: TravelCabinClass,
  currency: TravelCurrency
): NormalizedFlightOffer {
  const basePrice = Number(raw.basePrice) || 0;
  const taxes = Number(raw.taxes) || 0;
  return {
    id: raw.id,
    provider,
    airline: raw.airline,
    flightNumber: raw.flightNumber,
    departureAt: raw.departureAt,
    arrivalAt: raw.arrivalAt,
    durationMinutes: raw.durationMinutes,
    stops: raw.stops,
    originAirport: raw.originAirport,
    destinationAirport: raw.destinationAirport,
    baggage: raw.baggage,
    direct: raw.stops === 0,
    cabinClass,
    currency,
    basePrice,
    taxes,
    totalPrice: basePrice + taxes,
    expiresAt: raw.expiresAt,
    raw
  };
}
