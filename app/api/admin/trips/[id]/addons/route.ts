import { NextResponse } from "next/server";
import { z } from "zod";
import { createTripAddonService } from "@/lib/catalog-service";

const schema = z.object({
  name: z.string().min(2),
  price: z.number().min(0)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const addon = await createTripAddonService(id, payload);
    return NextResponse.json({ ok: true, addon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
