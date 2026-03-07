import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteRaffleService, updateRaffleService, updateRaffleStatusService } from "@/lib/raffles-service";

const schema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  rulesText: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  isFree: z.boolean().optional(),
  entryFee: z.number().optional(),
  paymentInstructions: z.string().optional(),
  requirements: z.string().optional(),
  prize: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  drawAt: z.string().optional(),
  numberPoolSize: z.number().int().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoOgImage: z.string().optional(),
  publicParticipantsEnabled: z.boolean().optional(),
  publicParticipantsMode: z.enum(["hidden", "name_only", "name_number", "masked"]).optional(),
  publicNumbersVisibility: z.boolean().optional(),
  publicNumberGridMode: z.enum(["full", "available_only", "sold_only", "totals_only"]).optional(),
  publicWinnerName: z.boolean().optional(),
  verificationMode: z.enum(["none", "commit_reveal"]).optional(),
  publicSeed: z.string().optional(),
  referralEnabled: z.boolean().optional(),
  viralCounterEnabled: z.boolean().optional(),
  urgencyMessage: z.string().optional(),
  publicActivityEnabled: z.boolean().optional(),
  liveDrawEnabled: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const raffle = payload.status && Object.keys(payload).length === 1
      ? await updateRaffleStatusService(id, payload.status)
      : await updateRaffleService(id, payload);
    if (!raffle) {
      return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, raffle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteRaffleService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
