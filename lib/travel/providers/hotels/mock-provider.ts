import type { HotelProvider } from "@/lib/travel/providers/hotels/provider";
import type { MockHotelRawOffer } from "@/lib/travel/normalizers/hotels";

const HOTEL_NAMES = [
  "Maison Meridian",
  "Atlas Grand",
  "Serenity Tower",
  "Nexa Boutique",
  "The Harbor Club",
  "Aurora Palace",
  "Lumen Suites",
  "Siena Urban",
  "Nomad House",
  "Vista Royale"
];

const AMENITY_POOL = [
  "wifi",
  "pool",
  "gym",
  "spa",
  "breakfast",
  "parking",
  "airport shuttle",
  "pet friendly"
];

function pickAmenities(index: number) {
  const base = [AMENITY_POOL[index % AMENITY_POOL.length], AMENITY_POOL[(index + 2) % AMENITY_POOL.length]];
  if (index % 2 === 0) {
    base.push("breakfast");
  }
  return Array.from(new Set(base));
}

export const mockHotelProvider: HotelProvider<MockHotelRawOffer> = {
  key: "mock_hotels",
  label: "Mock Hotels",
  async search(input) {
    const nights = Math.max(
      1,
      Math.ceil((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    );
    const minPrice = input.minPrice ?? 60;
    const maxPrice = Math.max(input.maxPrice ?? 920, minPrice + 50);

    const generated = Array.from({ length: 18 }).map((_, index) => {
      const pricePerNight = Math.min(maxPrice, minPrice + 40 + index * 28);
      const taxes = Number((pricePerNight * nights * 0.16).toFixed(2));
      const totalPrice = Number((pricePerNight * nights + taxes).toFixed(2));
      const stars = 3 + (index % 3);
      const amenities = pickAmenities(index);
      const destination = input.destination.trim() || "Destino";

      return {
        id: `MH-${destination.slice(0, 3).toUpperCase()}-${index + 1}`,
        hotelName: HOTEL_NAMES[index % HOTEL_NAMES.length],
        mainImage: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80&ixid=${index + 1}`,
        address: `${destination}, Zona ${index + 1}`,
        stars,
        rating: Number((4 + (index % 10) / 10).toFixed(1)),
        roomType: index % 2 === 0 ? "Deluxe King" : "Double Standard",
        mealPlan: index % 2 === 0 ? "Desayuno incluido" : "Solo hospedaje",
        cancellationPolicy: index % 3 === 0 ? "Cancelación flexible" : "No reembolsable",
        amenities,
        neighborhood: `Distrito ${((index % 4) + 1).toString()}`,
        pricePerNight,
        taxes,
        totalPrice,
        expiresAt: new Date(Date.now() + 1000 * 60 * 90).toISOString()
      } satisfies MockHotelRawOffer;
    });

    const filtered = generated
      .filter((offer) => (input.hotelName ? offer.hotelName.toLowerCase().includes(input.hotelName.toLowerCase()) : true))
      .filter((offer) => (input.stars ? offer.stars >= input.stars : true))
      .filter((offer) => (input.flexibleCancellation ? offer.cancellationPolicy?.toLowerCase().includes("flexible") : true))
      .filter((offer) => (input.breakfastIncluded ? offer.mealPlan?.toLowerCase().includes("desayuno") : true))
      .filter((offer) => (input.neighborhood ? offer.neighborhood?.toLowerCase().includes(input.neighborhood.toLowerCase()) : true))
      .filter((offer) =>
        input.amenities && input.amenities.length > 0
          ? input.amenities.every((item) =>
              offer.amenities.some((amenity) => amenity.toLowerCase().includes(item.toLowerCase()))
            )
          : true
      )
      .filter((offer) => (input.minPrice ? offer.pricePerNight >= input.minPrice : true))
      .filter((offer) => (input.maxPrice ? offer.pricePerNight <= input.maxPrice : true))
      .slice(0, 12);

    return {
      provider: "mock_hotels",
      offers: filtered
    };
  }
};
