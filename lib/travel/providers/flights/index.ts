import { mockFlightProvider } from "@/lib/travel/providers/flights/mock-provider";
import type { FlightProvider } from "@/lib/travel/providers/flights/provider";

const FLIGHT_PROVIDERS: Record<string, FlightProvider> = {
  mock: mockFlightProvider,
  mock_flights: mockFlightProvider
};

export function getFlightProvidersFromEnv() {
  const configured = process.env.TRAVEL_FLIGHT_PROVIDERS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) ?? ["mock"];
  const providers = configured.map((key) => FLIGHT_PROVIDERS[key]).filter(Boolean);
  return providers.length > 0 ? providers : [mockFlightProvider];
}
