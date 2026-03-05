import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePaypalOrder } from "@/lib/paypal";
import { getBooking, markBookingPaidByOrder } from "@/lib/booking-store";

const captureOrderSchema = z.object({
  bookingId: z.string().uuid(),
  orderId: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const payload = captureOrderSchema.parse(await request.json());
    const booking = getBooking(payload.bookingId);

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.paypalOrderId !== payload.orderId) {
      return NextResponse.json({ message: "Orden PayPal no corresponde con la reserva" }, { status: 400 });
    }

    const result = await capturePaypalOrder(payload.orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json(
        { message: "La captura de PayPal no se completó", status: result.status },
        { status: 400 }
      );
    }

    const updatedBooking = markBookingPaidByOrder(payload.orderId);

    return NextResponse.json({
      ok: true,
      orderId: result.id,
      status: result.status,
      bookingStatus: updatedBooking?.status ?? "pending"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
