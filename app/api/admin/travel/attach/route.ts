import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { attachOfferToPackageService } from "@/lib/travel/services/travel-service";

const flightOfferSchema = z.object({
  id: z.string(),
  provider: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
  departureAt: z.string(),
  arrivalAt: z.string(),
  durationMinutes: z.number(),
  stops: z.number(),
  originAirport: z.string(),
  destinationAirport: z.string(),
  baggage: z.string().optional(),
  direct: z.boolean(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "MXN"]),
  basePrice: z.number(),
  taxes: z.number(),
  totalPrice: z.number(),
  expiresAt: z.string().optional(),
  raw: z.unknown()
});

const hotelOfferSchema = z.object({
  id: z.string(),
  provider: z.string(),
  hotelName: z.string(),
  mainImage: z.string().optional(),
  address: z.string(),
  stars: z.number(),
  rating: z.number().optional(),
  roomType: z.string(),
  mealPlan: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  amenities: z.array(z.string()),
  neighborhood: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "MXN"]),
  pricePerNight: z.number(),
  taxes: z.number(),
  totalPrice: z.number(),
  expiresAt: z.string().optional(),
  raw: z.unknown()
});

const schema = z.object({
  packageId: z.string().uuid().optional(),
  createPackageName: z.string().optional(),
  destination: z.string().optional(),
  offerType: z.enum(["flight", "hotel"]),
  offer: z.union([flightOfferSchema, hotelOfferSchema])
});

export async function POST(request: Request) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = schema.parse(await request.json());
    const item = await attachOfferToPackageService({
      packageId: payload.packageId,
      createPackageName: payload.createPackageName,
      destination: payload.destination,
      offerType: payload.offerType,
      offer: payload.offer as never,
      actorId: access.auth.user?.id
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
