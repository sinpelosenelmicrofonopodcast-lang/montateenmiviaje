import { NextResponse } from "next/server";
import {
  getRaffleByIdService,
  getRafflePublicSummaryService,
  getRaffleVerificationPayloadService,
  listAvailableRaffleNumbersService,
  listPublicRaffleParticipantsService,
  listRaffleEntriesService
} from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raffle = await getRaffleByIdService(id);

    if (!raffle) {
      return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
    }
    if (raffle.status === "draft") {
      return NextResponse.json({ message: "Sorteo no disponible" }, { status: 404 });
    }

    const [summary, participants, verification] = await Promise.all([
      getRafflePublicSummaryService(id),
      listPublicRaffleParticipantsService(id),
      getRaffleVerificationPayloadService(id)
    ]);

    const entries = await listRaffleEntriesService(id);
    const availableNumbers = (await listAvailableRaffleNumbersService(id)) ?? [];
    const confirmedEntriesCount = entries.filter((entry) => entry.status === "confirmed").length;

    return NextResponse.json({
      raffle,
      entriesCount: entries.length,
      confirmedEntriesCount,
      availableNumbersCount: availableNumbers.length,
      availableNumbers,
      publicSummary: summary,
      publicParticipants: participants,
      verification
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
