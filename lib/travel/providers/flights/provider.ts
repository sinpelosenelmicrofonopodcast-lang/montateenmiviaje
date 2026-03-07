import type { FlightSearchInput } from "@/lib/travel/types";

export interface FlightProviderSearchResult<TRawOffer = unknown> {
  provider: string;
  offers: TRawOffer[];
}

export interface FlightProvider<TRawOffer = unknown> {
  key: string;
  label: string;
  search(input: FlightSearchInput): Promise<FlightProviderSearchResult<TRawOffer>>;
}
