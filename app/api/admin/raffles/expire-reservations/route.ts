import { NextResponse } from "next/server";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { processExpiredRaffleReservationsService } from "@/lib/raffles-service";

export async function POST() {
  const auth = await requireAdminServerAccess();
  try {
    const result = await processExpiredRaffleReservationsService({
      force: true,
      actorId: auth.user?.id
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
