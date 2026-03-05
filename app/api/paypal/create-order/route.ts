import { NextResponse } from "next/server";
import { z } from "zod";
import { attachPaypalOrder, getBooking } from "@/lib/booking-store";
import { createPaypalOrder } from "@/lib/paypal";

const createOrderSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const payload = createOrderSchema.parse(await request.json());
    const booking = getBooking(payload.bookingId);

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    if (Math.abs(booking.amount - payload.amount) > 0.01) {
      return NextResponse.json({ message: "Monto inválido para la reserva" }, { status: 400 });
    }

    const orderId = await createPaypalOrder(payload.amount);
    attachPaypalOrder(payload.bookingId, orderId);

    return NextResponse.json({ orderId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
