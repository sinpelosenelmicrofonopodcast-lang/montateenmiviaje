import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { searchHotelsService } from "@/lib/travel/services/travel-service";

const schema = z.object({
  destination: z.string().min(2),
  checkIn: z.string().min(8),
  checkOut: z.string().min(8),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10).default(0),
  rooms: z.number().int().min(1).max(6),
  hotelName: z.string().optional(),
  stars: z.number().int().min(1).max(5).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).optional(),
  neighborhood: z.string().optional(),
  flexibleCancellation: z.boolean().optional(),
  breakfastIncluded: z.boolean().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "MXN"]).default("USD")
});

export async function POST(request: Request) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = schema.parse(await request.json());
    const result = await searchHotelsService(payload, access.auth.user?.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
