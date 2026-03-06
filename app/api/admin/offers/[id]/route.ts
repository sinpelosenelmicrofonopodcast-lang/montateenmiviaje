import { NextResponse } from "next/server";
import { z } from "zod";
import { updateOfferService } from "@/lib/catalog-service";

const schema = z.object({
  active: z.boolean().optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  discountType: z.enum(["fixed", "percent"]).optional(),
  value: z.number().positive().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const offer = await updateOfferService(id, payload);
    return NextResponse.json({ ok: true, offer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
