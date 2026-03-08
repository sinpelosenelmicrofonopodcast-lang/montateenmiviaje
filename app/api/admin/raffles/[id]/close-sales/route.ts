import { NextResponse } from "next/server";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { closeRaffleSalesService, verifyRaffleDrawService } from "@/lib/raffles-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminServerAccess();
  try {
    const { id } = await params;
    const raffle = await closeRaffleSalesService(id, auth.user?.id);
    const verification = await verifyRaffleDrawService(id);
    return NextResponse.json({ ok: true, raffle, verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 400 });
  }
}
