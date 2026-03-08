import { NextResponse } from "next/server";
import type { Raffle } from "@/lib/types";
import {
  getRaffleByIdService,
  getRafflePublicSummaryService,
  getRaffleVerificationPayloadService,
  listAvailableRaffleNumbersService,
  listPublicRaffleParticipantsService
} from "@/lib/raffles-service";

function sanitizePublicRaffle(raffle: Raffle) {
  return {
    ...raffle,
    drawSecret: undefined,
    drawPayloadJson: undefined
  };
}

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

    const availableNumbers = (await listAvailableRaffleNumbersService(id)) ?? [];
    const confirmedEntriesCount = summary.metrics.confirmedEntries;

    return NextResponse.json({
      raffle: sanitizePublicRaffle(raffle),
      entriesCount: confirmedEntriesCount,
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
