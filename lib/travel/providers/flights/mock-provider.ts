import type { FlightProvider } from "@/lib/travel/providers/flights/provider";
import type { MockFlightRawOffer } from "@/lib/travel/normalizers/flights";

const AIRLINES = ["Delta", "United", "American Airlines", "JetBlue", "Iberia", "Air France"];
const AIRPORTS = ["JFK", "MIA", "LAX", "MAD", "CDG", "LHR", "DXB", "BOG", "MEX"];

function pickAirport(preferred: string, index: number) {
  if (preferred.trim().length >= 3) {
    return preferred.trim().slice(0, 3).toUpperCase();
  }
  return AIRPORTS[index % AIRPORTS.length];
}

function addMinutes(isoDate: string, minutes: number) {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

function buildOfferId(origin: string, destination: string, index: number) {
  const o = origin.slice(0, 3).toUpperCase();
  const d = destination.slice(0, 3).toUpperCase();
  return `MF-${o}-${d}-${index + 1}`;
}

export const mockFlightProvider: FlightProvider<MockFlightRawOffer> = {
  key: "mock_flights",
  label: "Mock Flights",
  async search(input) {
    const originAirport = pickAirport(input.origin, 0);
    const destinationAirport = pickAirport(input.destination, 2);
    const departureSeed = new Date(`${input.departureDate}T10:00:00.000Z`).toISOString();
    const minPrice = input.minPrice ?? 120;
    const maxPrice = Math.max(input.maxPrice ?? 2200, minPrice + 80);

    const generated = Array.from({ length: 14 }).map((_, index) => {
      const airline = AIRLINES[index % AIRLINES.length];
      const stops = index % 4 === 0 ? 0 : index % 3;
      const duration = 180 + (index * 37) % 420 + stops * 65;
      const basePrice = Math.min(maxPrice, minPrice + 85 + index * 73);
      const taxes = Number((basePrice * 0.14).toFixed(2));
      const departureAt = addMinutes(departureSeed, index * 95);
      const arrivalAt = addMinutes(departureAt, duration);

      return {
        id: buildOfferId(originAirport, destinationAirport, index),
        airline,
        flightNumber: `${airline.slice(0, 2).toUpperCase()}${210 + index}`,
        departureAt,
        arrivalAt,
        durationMinutes: duration,
        stops,
        originAirport,
        destinationAirport,
        baggage: input.includeBags ? "1 maleta + equipaje de mano" : "Solo equipaje de mano",
        basePrice,
        taxes,
        expiresAt: new Date(Date.now() + 1000 * 60 * 45).toISOString()
      } satisfies MockFlightRawOffer;
    });

    const filtered = generated
      .filter((offer) => (input.directOnly ? offer.stops === 0 : true))
      .filter((offer) => (input.airline ? offer.airline.toLowerCase().includes(input.airline.toLowerCase()) : true))
      .filter((offer) => (input.minPrice ? offer.basePrice >= input.minPrice : true))
      .filter((offer) => (input.maxPrice ? offer.basePrice <= input.maxPrice : true))
      .slice(0, 10);

    return {
      provider: "mock_flights",
      offers: filtered
    };
  }
};
