import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { registerOfflineRaffleSaleService } from "@/lib/raffles-service";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  quantity: z.number().int().min(1).max(100).optional(),
  numbers: z.array(z.number().int().positive()).optional(),
  randomAssignment: z.boolean().optional(),
  paymentMethod: z.enum(["paypal", "zelle", "cashapp", "ath_movil", "cash", "venmo", "other"]),
  amount: z.number().nonnegative().optional(),
  paymentReference: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
  markAsConfirmed: z.boolean().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminServerAccess();
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());

    const result = await registerOfflineRaffleSaleService({
      raffleId: id,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      quantity: payload.quantity,
      numbers: payload.numbers,
      randomAssignment: payload.randomAssignment,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
      paymentReference: payload.paymentReference,
      note: payload.note,
      markAsConfirmed: payload.markAsConfirmed
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
