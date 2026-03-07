import type { HotelSearchInput } from "@/lib/travel/types";

export interface HotelProviderSearchResult<TRawOffer = unknown> {
  provider: string;
  offers: TRawOffer[];
}

export interface HotelProvider<TRawOffer = unknown> {
  key: string;
  label: string;
  search(input: HotelSearchInput): Promise<HotelProviderSearchResult<TRawOffer>>;
}
