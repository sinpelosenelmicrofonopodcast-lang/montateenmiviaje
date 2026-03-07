import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createRaffleService,
  getRaffleAdminSnapshotService,
  listRaffleEntriesService,
  listRafflesService
} from "@/lib/raffles-service";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  rulesText: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  isFree: z.boolean(),
  entryFee: z.number().min(0),
  paymentInstructions: z.string().min(2),
  requirements: z.string().min(2),
  prize: z.string().min(2),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  drawAt: z.string().min(4),
  numberPoolSize: z.number().int().min(1).max(5000),
  status: z.enum(["draft", "published", "closed"]),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raffleId = searchParams.get("raffleId");

    if (raffleId) {
      const snapshot = await getRaffleAdminSnapshotService(raffleId);
      return NextResponse.json({ snapshot });
    }

    const [raffles, entries] = await Promise.all([
      listRafflesService({ includeDrafts: true }),
      listRaffleEntriesService()
    ]);

    return NextResponse.json({
      raffles,
      entries
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const raffle = await createRaffleService(payload);
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
