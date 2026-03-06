import { NextResponse } from "next/server";
import { z } from "zod";
import { listBookingsService, updateBookingStageService } from "@/lib/runtime-service";

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
  const bookings = await listBookingsService();
  return NextResponse.json({ bookings });
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());
    const booking = await updateBookingStageService(payload.bookingId, payload.stage);

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
