import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { createTravelQuoteService, listTravelQuotesService } from "@/lib/travel/services/travel-service";

const quoteItemSchema = z.object({
  itemType: z.enum(["flight", "hotel", "transfer", "activity", "insurance", "fee", "manual"]),
  providerName: z.string().optional(),
  externalOfferId: z.string().optional(),
  title: z.string().min(2),
  summary: z.record(z.unknown()).optional(),
  raw: z.record(z.unknown()).optional(),
  basePrice: z.number().nonnegative(),
  taxes: z.number().nonnegative().optional(),
  markup: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  sortOrder: z.number().int().min(0).optional()
});

const createQuoteSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  destination: z.string().min(2),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  currency: z.string().default("USD"),
  status: z.enum(["draft", "sent", "approved", "expired", "cancelled"]).optional(),
  notesInternal: z.string().optional(),
  notesClient: z.string().optional(),
  expiresAt: z.string().optional(),
  feesTotal: z.number().nonnegative().optional(),
  markupTotal: z.number().nonnegative().optional(),
  taxesTotal: z.number().nonnegative().optional(),
  discountTotal: z.number().nonnegative().optional(),
  items: z.array(quoteItemSchema).min(1)
});

export async function GET() {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const quotes = await listTravelQuotesService();
    return NextResponse.json({ quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = createQuoteSchema.parse(await request.json());
    const quote = await createTravelQuoteService(payload, access.auth.user?.id);
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
