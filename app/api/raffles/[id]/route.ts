import { NextResponse } from "next/server";
import {
  getRaffleByIdService,
  listAvailableRaffleNumbersService,
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

    const entries = await listRaffleEntriesService(id);
    const availableNumbers = (await listAvailableRaffleNumbersService(id)) ?? [];
    const confirmedEntriesCount = entries.filter((entry) => entry.status === "confirmed").length;

    return NextResponse.json({
      raffle,
      entriesCount: entries.length,
      confirmedEntriesCount,
      availableNumbersCount: availableNumbers.length,
      availableNumbers
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
