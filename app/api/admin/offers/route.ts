import { NextResponse } from "next/server";
import { z } from "zod";
import { createOfferService, listOffersService } from "@/lib/catalog-service";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  code: z.string().min(3),
  discountType: z.enum(["fixed", "percent"]),
  value: z.number().positive(),
  tripSlug: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  active: z.boolean().default(true)
});

export async function GET() {
  try {
    const offers = await listOffersService();
    return NextResponse.json({ offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const offer = await createOfferService(payload);
    return NextResponse.json({ ok: true, offer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
