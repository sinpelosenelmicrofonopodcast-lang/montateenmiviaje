import { NextResponse } from "next/server";
import { z } from "zod";
import { registerCustomer } from "@/lib/booking-store";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const customer = registerCustomer(payload);
    return NextResponse.json({ ok: true, customerId: customer.id, isRegistered: customer.isRegistered });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
