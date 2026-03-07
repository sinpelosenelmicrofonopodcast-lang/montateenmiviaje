import { NextResponse } from "next/server";
import { getRaffleByIdService, verifyRaffleDrawService } from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raffle = await getRaffleByIdService(id);
    if (!raffle || raffle.status === "draft") {
      return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
    }
    const verification = await verifyRaffleDrawService(id);
    return NextResponse.json({ verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
