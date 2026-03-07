import { NextResponse } from "next/server";
import { z } from "zod";
import { createTestimonialService, listTestimonialsService } from "@/lib/catalog-service";

const schema = z.object({
  customerName: z.string().min(2),
  tripTitle: z.string().min(2),
  quote: z.string().min(5),
  rating: z.number().int().min(1).max(5),
  verified: z.boolean().default(false),
  approved: z.boolean().default(false),
  city: z.string().optional(),
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  featured: z.boolean().optional(),
  publishStatus: z.enum(["draft", "published", "archived"]).optional()
});

export async function GET() {
  try {
    const testimonials = await listTestimonialsService();
    return NextResponse.json({ testimonials });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const testimonial = await createTestimonialService(payload);
    return NextResponse.json({ ok: true, testimonial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
