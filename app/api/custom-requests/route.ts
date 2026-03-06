import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomTripRequestService, listCustomTripRequestsService } from "@/lib/runtime-service";

const createSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  destination: z.string().min(2),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  travelers: z.number().int().min(1).max(20),
  budget: z.number().positive(),
  motive: z.string().min(2),
  expectations: z.string().min(4)
});

export async function GET() {
  const requests = await listCustomTripRequestsService();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const customRequest = await createCustomTripRequestService(payload);
    return NextResponse.json({
      requestId: customRequest.id,
      status: customRequest.status,
      packagePageUrl: `/propuesta/${customRequest.id}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
