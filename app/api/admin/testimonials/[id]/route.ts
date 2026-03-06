import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTestimonialService } from "@/lib/catalog-service";

const schema = z.object({
  verified: z.boolean().optional(),
  approved: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const testimonial = await updateTestimonialService(id, payload);
    return NextResponse.json({ ok: true, testimonial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
