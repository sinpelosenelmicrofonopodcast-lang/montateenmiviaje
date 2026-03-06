import { NextResponse } from "next/server";
import { drawRaffleWinnerService } from "@/lib/raffles-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await drawRaffleWinnerService(id);

    return NextResponse.json({
      ok: true,
      raffle: result.raffle,
      winner: result.winnerEntry
        ? {
            entryId: result.winnerEntry.id,
            customerEmail: result.winnerEntry.customerEmail,
            chosenNumber: result.winnerEntry.chosenNumber
          }
        : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("no encontrado")
      ? 404
      : message.includes("no está publicado") || message.includes("hora del sorteo")
        ? 400
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
