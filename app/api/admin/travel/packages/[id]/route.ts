import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { getTravelPackageByIdService, updateTravelPackageService } from "@/lib/travel/services/travel-service";

const itemSchema = z.object({
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

const patchSchema = z.object({
  packageName: z.string().min(3).optional(),
  destination: z.string().min(2).optional(),
  status: z.enum(["draft", "internal", "ready", "archived"]).optional(),
  visibility: z.enum(["internal", "private"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  baseQuoteId: z.string().uuid().optional(),
  linkedTripSlug: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  items: z.array(itemSchema).optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const packageData = await getTravelPackageByIdService(id);
    if (!packageData) {
      return NextResponse.json({ message: "Paquete no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ package: packageData });
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
    const packageData = await updateTravelPackageService(id, payload, access.auth.user?.id);
    return NextResponse.json({ ok: true, package: packageData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
