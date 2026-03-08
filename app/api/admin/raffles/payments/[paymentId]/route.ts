import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { updateRafflePaymentManualStatusService } from "@/lib/raffles-service";

const schema = z.object({
  status: z.enum(["approved", "rejected", "cancelled"]),
  manuallyVerified: z.boolean(),
  adminNote: z.string().max(500).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  await requireAdminServerAccess();
  try {
    const { paymentId } = await params;
    const payload = schema.parse(await request.json());

    const payment = await updateRafflePaymentManualStatusService({
      paymentId,
      status: payload.status,
      manuallyVerified: payload.manuallyVerified,
      adminNote: payload.adminNote
    });

    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 400 });
  }
}
