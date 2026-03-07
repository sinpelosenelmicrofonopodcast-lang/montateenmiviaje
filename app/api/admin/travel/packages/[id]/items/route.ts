import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { addTravelPackageItemService } from "@/lib/travel/services/travel-service";

const schema = z.object({
  itemType: z.enum(["flight", "hotel", "transfer", "activity", "insurance", "fee", "manual"]),
  sourceQuoteItemId: z.string().uuid().optional(),
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const item = await addTravelPackageItemService(id, payload, access.auth.user?.id);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
