import { NextResponse } from "next/server";
import { z } from "zod";
import { updateRaffleStatus } from "@/lib/booking-store";

const schema = z.object({
  status: z.enum(["draft", "published", "closed"])
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const raffle = updateRaffleStatus(id, payload.status);
    if (!raffle) {
      return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, raffle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 400 });
  }
}
