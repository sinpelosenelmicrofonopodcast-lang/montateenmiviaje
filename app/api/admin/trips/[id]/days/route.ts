import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertTripDayService } from "@/lib/catalog-service";

const schema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(2),
  description: z.string().min(4),
  mapPin: z.string().max(80).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const day = await upsertTripDayService(id, payload);
    return NextResponse.json({ ok: true, day });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
