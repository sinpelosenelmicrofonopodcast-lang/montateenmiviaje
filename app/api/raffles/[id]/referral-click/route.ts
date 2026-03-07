import { NextResponse } from "next/server";
import { z } from "zod";
import { getRaffleByIdService, trackRaffleReferralClickService } from "@/lib/raffles-service";

const schema = z.object({
  referralCode: z.string().min(2).max(40),
  source: z.string().max(80).optional(),
  campaign: z.string().max(80).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raffle = await getRaffleByIdService(id);
    if (!raffle || raffle.status !== "published") {
      return NextResponse.json({ message: "Sorteo no disponible" }, { status: 404 });
    }
    const payload = schema.parse(await request.json());

    const result = await trackRaffleReferralClickService(id, payload.referralCode, {
      source: payload.source,
      campaign: payload.campaign
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
