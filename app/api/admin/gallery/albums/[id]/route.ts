import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteGalleryAlbumService, updateGalleryAlbumService } from "@/lib/catalog-service";

const schema = z.object({
  tripSlug: z.string().min(2).optional(),
  title: z.string().min(3).optional(),
  coverImage: z.string().url().optional(),
  featured: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const album = await updateGalleryAlbumService(id, payload);
    return NextResponse.json({ ok: true, album });
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
    const result = await deleteGalleryAlbumService(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
