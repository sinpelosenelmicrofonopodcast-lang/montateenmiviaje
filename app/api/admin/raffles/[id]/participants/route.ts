import { NextResponse } from "next/server";
import { listPublicRaffleParticipantsService } from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participants = await listPublicRaffleParticipantsService(id);
    return NextResponse.json({ participants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
