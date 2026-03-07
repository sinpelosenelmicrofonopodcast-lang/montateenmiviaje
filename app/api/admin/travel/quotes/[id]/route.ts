import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { getTravelQuoteByIdService, updateTravelQuoteService } from "@/lib/travel/services/travel-service";

const itemSchema = z.object({
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

const patchSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  destination: z.string().min(2).optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(["draft", "sent", "approved", "expired", "cancelled"]).optional(),
  notesInternal: z.string().optional(),
  notesClient: z.string().optional(),
  expiresAt: z.string().optional(),
  feesTotal: z.number().nonnegative().optional(),
  markupTotal: z.number().nonnegative().optional(),
  taxesTotal: z.number().nonnegative().optional(),
  discountTotal: z.number().nonnegative().optional(),
  items: z.array(itemSchema).optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const quote = await getTravelQuoteByIdService(id);
    if (!quote) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const payload = patchSchema.parse(await request.json());
    const quote = await updateTravelQuoteService(id, payload, access.auth.user?.id);
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
