import { NextResponse } from "next/server";
import { getRaffleById, listAvailableRaffleNumbers, listRaffleEntries } from "@/lib/booking-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raffle = getRaffleById(id);

  if (!raffle) {
    return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
  }

  const entries = listRaffleEntries(id);
  const availableNumbers = listAvailableRaffleNumbers(id) ?? [];
  const confirmedEntriesCount = entries.filter((entry) => entry.status === "confirmed").length;

  return NextResponse.json({
    raffle,
    entriesCount: entries.length,
    confirmedEntriesCount,
    availableNumbersCount: availableNumbers.length,
    availableNumbers
  });
}
