import { NextResponse } from "next/server";
import { z } from "zod";
import { registerCustomerService } from "@/lib/raffles-service";

const schema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  authUserId: z.string().uuid().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const customer = await registerCustomerService(payload);
    return NextResponse.json({ ok: true, customerId: customer.id, isRegistered: customer.isRegistered });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
