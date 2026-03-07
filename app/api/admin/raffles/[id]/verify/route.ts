import { NextResponse } from "next/server";
import { verifyRaffleDrawService } from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const verification = await verifyRaffleDrawService(id);
    return NextResponse.json({ verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
