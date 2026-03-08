import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { updateRaffleEntryStatusService } from "@/lib/raffles-service";

const schema = z.object({
  status: z.enum(["pending_payment", "pending_review", "confirmed", "rejected", "cancelled"])
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  await requireAdminServerAccess();
  try {
    const { entryId } = await params;
    const payload = schema.parse(await request.json());
    const entry = await updateRaffleEntryStatusService(entryId, payload.status);

    if (!entry) {
      return NextResponse.json({ message: "Entrada no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status =
      message.includes("sorteo ya sorteado") || message.includes("reasignado") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
