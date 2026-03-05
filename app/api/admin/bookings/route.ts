import { NextResponse } from "next/server";
import { z } from "zod";
import { listBookings, updateBookingStage } from "@/lib/booking-store";

const updateSchema = z.object({
  bookingId: z.string().uuid(),
  stage: z.enum([
    "lead",
    "contactado",
    "reservado",
    "deposito_pagado",
    "pagado_parcial",
    "pagado_total",
    "completado",
    "cancelado"
  ])
});

export async function GET() {
  return NextResponse.json({ bookings: listBookings() });
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const booking = updateBookingStage(payload.bookingId, payload.stage);

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
