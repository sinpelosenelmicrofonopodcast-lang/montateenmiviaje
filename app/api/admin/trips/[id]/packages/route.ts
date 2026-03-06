import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertTripPackageService } from "@/lib/catalog-service";

const schema = z.object({
  roomType: z.enum(["single", "doble", "triple"]),
  pricePerPerson: z.number().positive(),
  deposit: z.number().positive(),
  paymentPlan: z.string().min(3)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const pkg = await upsertTripPackageService(id, payload);
    return NextResponse.json({ ok: true, pkg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
