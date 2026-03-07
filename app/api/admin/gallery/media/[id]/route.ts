import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteGalleryMediaService, updateGalleryMediaService } from "@/lib/catalog-service";

const schema = z.object({
  albumId: z.string().uuid().optional(),
  type: z.enum(["photo", "video"]).optional(),
  url: z.string().url().optional(),
  caption: z.string().min(2).optional(),
  sortOrder: z.number().int().min(0).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const media = await updateGalleryMediaService(id, payload);
    return NextResponse.json({ ok: true, media });
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
    const result = await deleteGalleryMediaService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
