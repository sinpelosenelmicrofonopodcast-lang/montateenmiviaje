import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePaypalOrder } from "@/lib/paypal";
import { dispatchNotificationEventSafe } from "@/lib/notifications/orchestrator";
import { getBookingService, markBookingPaidByOrderService } from "@/lib/runtime-service";
import { captureRafflePayPalOrderService } from "@/lib/raffles-service";

const bookingCaptureSchema = z.object({
  bookingId: z.string().uuid(),
  orderId: z.string().min(3),
  reservationGroupId: z.never().optional()
});

const raffleCaptureSchema = z.object({
  orderId: z.string().min(3),
  reservationGroupId: z.string().uuid().optional(),
  bookingId: z.never().optional()
});

const captureOrderSchema = z.union([bookingCaptureSchema, raffleCaptureSchema]);

export async function POST(request: Request) {
  try {
    const payload = captureOrderSchema.parse(await request.json());

    if (!("bookingId" in payload)) {
      const raffleResult = await captureRafflePayPalOrderService({
        orderId: payload.orderId,
        reservationGroupId: payload.reservationGroupId
      });

      return NextResponse.json({
        ok: true,
        flow: "raffle",
        orderId: payload.orderId,
        status: raffleResult.payment.status,
        assignedNumbers: raffleResult.assignedNumbers,
        reservationGroupId: raffleResult.payment.reservationGroupId,
        idempotent: raffleResult.idempotent
      });
    }

    const bookingId = payload.bookingId;
    if (!bookingId) {
      return NextResponse.json({ message: "bookingId requerido" }, { status: 400 });
    }

    const booking = await getBookingService(bookingId);

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.paypalOrderId !== payload.orderId) {
      return NextResponse.json({ message: "Orden PayPal no corresponde con la reserva" }, { status: 400 });
    }

    const result = await capturePaypalOrder(payload.orderId);

    if (result.status !== "COMPLETED") {
      await dispatchNotificationEventSafe({
        eventType: "PAYMENT_FAILED",
        entityType: "booking",
        entityId: booking.id,
        recipients: { scope: "booking_id", bookingId: booking.id },
        channels: ["inbox", "push", "email"],
        variables: {
          amount: booking.amount,
          bookingId: booking.id,
          link: "/portal/pagos"
        },
        link: "/portal/pagos",
        metadata: {
          source: "paypal_capture_non_completed",
          status: result.status,
          orderId: payload.orderId
        },
        dedupeKey: `paypal-payment-failed:${payload.orderId}:${result.status}`
      });

      return NextResponse.json(
        { message: "La captura de PayPal no se completó", status: result.status },
        { status: 400 }
      );
    }

    const updatedBooking = await markBookingPaidByOrderService(payload.orderId);

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
    const status =
      message.includes("reserva")
      || message.includes("monto")
      || message.includes("coincide")
      || message.includes("expir")
      || message.includes("No se encontró")
        ? 400
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
