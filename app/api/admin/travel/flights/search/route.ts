import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { searchFlightsService } from "@/lib/travel/services/travel-service";

const schema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().min(8),
  returnDate: z.string().optional(),
  oneWay: z.boolean().default(false),
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(9).default(0),
  infants: z.number().int().min(0).max(4).default(0),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  includeBags: z.boolean().optional(),
  directOnly: z.boolean().optional(),
  airline: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "MXN"]).default("USD"),
  flexibleDates: z.boolean().optional()
});

export async function POST(request: Request) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = schema.parse(await request.json());
    const result = await searchFlightsService(payload, access.auth.user?.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
