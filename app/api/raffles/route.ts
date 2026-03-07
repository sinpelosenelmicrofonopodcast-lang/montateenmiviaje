import { NextResponse } from "next/server";
import { z } from "zod";
import { enterRaffleService, listRafflesService } from "@/lib/raffles-service";

const joinSchema = z.object({
  raffleId: z.string().uuid(),
  customerEmail: z.string().email(),
  chosenNumber: z.number().int().positive(),
  note: z.string().max(400).optional(),
  paymentReference: z.string().max(120).optional(),
  referredByCode: z.string().max(40).optional(),
  publicDisplayName: z.string().max(120).optional(),
  consentPublicListing: z.boolean().optional(),
  paymentMethod: z.string().max(40).optional(),
  paymentScreenshotUrl: z.string().max(1000).optional(),
  phone: z.string().max(50).optional()
});

export async function GET() {
  try {
    const raffles = await listRafflesService({ includeClosed: true });
    return NextResponse.json({ raffles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = joinSchema.parse(await request.json());
    const entry = await enterRaffleService(
      payload.raffleId,
      payload.customerEmail,
      payload.chosenNumber,
      payload.note,
      payload.paymentReference,
      {
        referredByCode: payload.referredByCode,
        publicDisplayName: payload.publicDisplayName,
        consentPublicListing: payload.consentPublicListing,
        paymentMethod: payload.paymentMethod,
        paymentScreenshotUrl: payload.paymentScreenshotUrl,
        phone: payload.phone
      }
    );
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status =
      message.includes("registrado") ||
      message.includes("disponible") ||
      message.includes("participas") ||
      message.includes("número") ||
      message.includes("cerró") ||
      message.includes("inicia")
        ? 400
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
