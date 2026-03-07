import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTripService, updateTripService } from "@/lib/catalog-service";

const tripSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  destination: z.string().min(2),
  category: z.enum(["Luxury", "Adventure", "Family", "Romantic", "Budget"]),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  availableSpots: z.number().int().min(0),
  totalSpots: z.number().int().min(1),
  heroImage: z.string().min(1),
  summary: z.string().min(10),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  galleryImages: z.array(z.string()).optional(),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  policies: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  hotels: z.array(z.string()).default([]),
  publishStatus: z.enum(["draft", "published", "unpublished", "sold_out", "archived"]),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoOgImage: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = tripSchema.parse(await request.json());
    const trip = await updateTripService(id, payload);
    return NextResponse.json({ ok: true, trip });
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
    const result = await deleteTripService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
