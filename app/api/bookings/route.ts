import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripBySlugService } from "@/lib/catalog-service";
import { createBookingWithTripService } from "@/lib/runtime-service";

const createBookingSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  tripSlug: z.string().min(2),
  roomType: z.enum(["single", "doble", "triple"]),
  travelers: z.number().int().min(1).max(4),
  amount: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const payload = createBookingSchema.parse(await request.json());
    const trip = await getTripBySlugService(payload.tripSlug, { includeUnpublished: true });

    if (!trip) {
      return NextResponse.json({ message: "Viaje no encontrado" }, { status: 404 });
    }

    const selectedPackage = trip.packages.find((pkg) => pkg.roomType === payload.roomType);
    if (!selectedPackage) {
      return NextResponse.json({ message: "Paquete inválido" }, { status: 400 });
    }

    const expectedDeposit = selectedPackage.deposit * payload.travelers;
    if (Math.abs(expectedDeposit - payload.amount) > 0.01) {
      return NextResponse.json({ message: "Monto de depósito inválido" }, { status: 400 });
    }

    const booking = await createBookingWithTripService({
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      tripSlug: payload.tripSlug,
      roomType: payload.roomType,
      travelers: payload.travelers,
      depositAmount: payload.amount
    }, trip);

    return NextResponse.json({
      bookingId: booking.id,
      amount: booking.amount,
      totalAmount: booking.totalAmount,
      balanceAmount: booking.balanceAmount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
