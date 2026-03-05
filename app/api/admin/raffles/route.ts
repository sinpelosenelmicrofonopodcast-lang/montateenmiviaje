import { NextResponse } from "next/server";
import { z } from "zod";
import { createRaffle, listRaffleEntries, listRaffles } from "@/lib/booking-store";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  isFree: z.boolean(),
  entryFee: z.number().min(0),
  paymentInstructions: z.string().min(2),
  requirements: z.string().min(2),
  prize: z.string().min(2),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  drawAt: z.string().min(4),
  numberPoolSize: z.number().int().min(1).max(5000),
  status: z.enum(["draft", "published", "closed"])
});

export async function GET() {
  return NextResponse.json({
    raffles: listRaffles({ includeDrafts: true }),
    entries: listRaffleEntries()
  });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const raffle = createRaffle(payload);
    return NextResponse.json({ ok: true, raffle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status =
      message.includes("inválida") ||
      message.includes("cierre") ||
      message.includes("anuncio") ||
      message.includes("números")
        ? 400
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
