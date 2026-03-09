import { NextResponse } from "next/server";
import { z } from "zod";
import { releaseRaffleReservationGroupService } from "@/lib/raffles-service";

const releaseSchema = z.object({
  reservationGroupId: z.string().uuid(),
  reason: z.enum(["cancelled", "expired", "failed"]).default("cancelled")
});

export async function POST(request: Request) {
  try {
    const payload = releaseSchema.parse(await request.json());
    const result = await releaseRaffleReservationGroupService({
      reservationGroupId: payload.reservationGroupId,
      reason: payload.reason,
      skipNotifications: false
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
