import { NextResponse } from "next/server";
import { z } from "zod";
import { listRaffleNumbersService, updateRaffleNumbersService } from "@/lib/raffles-service";

const bulkSchema = z.object({
  numbers: z.array(z.number().int().positive()).min(1),
  action: z.enum(["block", "unblock", "reserve", "mark_sold", "cancel"]),
  note: z.string().max(400).optional(),
  blockedReason: z.string().max(240).optional(),
  paymentMethod: z.enum(["paypal", "zelle", "cashapp", "ath_movil", "cash", "venmo", "other"]).optional()
});

const statuses = ["available", "blocked", "reserved", "pending_manual_review", "sold", "cancelled", "winner"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "0") || undefined;

    const requestedStatuses = statusParam
      ? statusParam
          .split(",")
          .map((item) => item.trim())
          .filter((item): item is (typeof statuses)[number] => statuses.includes(item as (typeof statuses)[number]))
      : undefined;

    const numbers = await listRaffleNumbersService(id, {
      statuses: requestedStatuses,
      search,
      limit
    });

    return NextResponse.json({ numbers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = bulkSchema.parse(await request.json());
    const result = await updateRaffleNumbersService({
      raffleId: id,
      numbers: payload.numbers,
      action: payload.action,
      note: payload.note,
      blockedReason: payload.blockedReason,
      paymentMethod: payload.paymentMethod
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 400 });
  }
}
