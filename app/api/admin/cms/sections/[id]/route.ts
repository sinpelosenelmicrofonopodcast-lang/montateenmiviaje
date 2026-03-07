import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePageSectionService, updatePageSectionService } from "@/lib/cms-service";

const patchSchema = z.object({
  sectionKey: z.string().min(2).optional(),
  sectionType: z.string().min(2).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badge: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  content: z.record(z.any()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const payload = patchSchema.parse(await request.json());
    const section = await updatePageSectionService(id, payload);
    return NextResponse.json({ ok: true, section });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await deletePageSectionService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
