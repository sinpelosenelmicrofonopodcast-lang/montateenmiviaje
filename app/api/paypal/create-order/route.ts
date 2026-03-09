import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaypalOrder } from "@/lib/paypal";
import { attachPaypalOrderService, getBookingService } from "@/lib/runtime-service";
import { createRafflePayPalOrderService } from "@/lib/raffles-service";

const bookingCreateOrderSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  reservationGroupId: z.never().optional()
});

const raffleCreateOrderSchema = z.object({
  reservationGroupId: z.string().uuid(),
  bookingId: z.never().optional(),
  amount: z.never().optional()
});

const createOrderSchema = z.union([bookingCreateOrderSchema, raffleCreateOrderSchema]);

export async function POST(request: Request) {
  try {
    const payload = createOrderSchema.parse(await request.json());
    if ("reservationGroupId" in payload) {
      const reservationGroupId = payload.reservationGroupId;
      if (!reservationGroupId) {
        return NextResponse.json({ message: "reservationGroupId requerido" }, { status: 400 });
      }
      const raffleOrder = await createRafflePayPalOrderService({
        reservationGroupId
      });
      if (!raffleOrder.orderId) {
        return NextResponse.json({ message: "No se pudo crear la orden PayPal para la rifa" }, { status: 400 });
      }
      return NextResponse.json({ orderId: raffleOrder.orderId, flow: "raffle" });
    }

    const bookingId = payload.bookingId;
    const amount = payload.amount;
    if (!bookingId || typeof amount !== "number") {
      return NextResponse.json({ message: "bookingId y amount son requeridos" }, { status: 400 });
    }

    const booking = await getBookingService(bookingId);

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    if (Math.abs(booking.amount - amount) > 0.01) {
      return NextResponse.json({ message: "Monto inválido para la reserva" }, { status: 400 });
    }

    const orderId = await createPaypalOrder(amount);
    await attachPaypalOrderService(bookingId, orderId);

    return NextResponse.json({ orderId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status =
      message.includes("reserva")
      || message.includes("expir")
      || message.includes("migración")
      || message.includes("Monto inválido")
        ? 400
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
