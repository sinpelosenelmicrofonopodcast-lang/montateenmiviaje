import { NextResponse } from "next/server";
import { z } from "zod";
import { reserveRaffleNumbersForPaypalService } from "@/lib/raffles-service";

const reserveSchema = z.object({
  raffleId: z.string().uuid(),
  customerEmail: z.string().email(),
  chosenNumbers: z.array(z.number().int().positive()).min(1).max(20),
  fullName: z.string().max(120).optional(),
  phone: z.string().max(50).optional(),
  note: z.string().max(400).optional(),
  referredByCode: z.string().max(40).optional()
});

export async function POST(request: Request) {
  try {
    const payload = reserveSchema.parse(await request.json());
    const reservation = await reserveRaffleNumbersForPaypalService(payload);

    return NextResponse.json({
      ok: true,
      reservation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status =
      message.includes("disponible")
      || message.includes("Selecciona")
      || message.includes("registrado")
      || message.includes("expir")
      || message.includes("migración")
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
