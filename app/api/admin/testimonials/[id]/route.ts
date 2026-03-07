import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTestimonialService, updateTestimonialService } from "@/lib/catalog-service";

const schema = z.object({
  verified: z.boolean().optional(),
  approved: z.boolean().optional(),
  customerName: z.string().optional(),
  tripTitle: z.string().optional(),
  quote: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  city: z.string().optional(),
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  featured: z.boolean().optional(),
  publishStatus: z.enum(["draft", "published", "archived"]).optional()
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

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteTestimonialService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
