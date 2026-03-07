import { mockHotelProvider } from "@/lib/travel/providers/hotels/mock-provider";
import type { HotelProvider } from "@/lib/travel/providers/hotels/provider";

const HOTEL_PROVIDERS: Record<string, HotelProvider> = {
  mock: mockHotelProvider,
  mock_hotels: mockHotelProvider
};

export function getHotelProvidersFromEnv() {
  const configured = process.env.TRAVEL_HOTEL_PROVIDERS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) ?? ["mock"];
  const providers = configured.map((key) => HOTEL_PROVIDERS[key]).filter(Boolean);
  return providers.length > 0 ? providers : [mockHotelProvider];
}
