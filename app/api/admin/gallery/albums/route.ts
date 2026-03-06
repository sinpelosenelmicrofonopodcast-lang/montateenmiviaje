import { NextResponse } from "next/server";
import { z } from "zod";
import { createGalleryAlbumService, listGalleryBundlesService } from "@/lib/catalog-service";

const schema = z.object({
  tripSlug: z.string().min(2),
  title: z.string().min(3),
  coverImage: z.string().url(),
  featured: z.boolean().default(false)
});

export async function GET() {
  try {
    const bundles = await listGalleryBundlesService();
    return NextResponse.json({ bundles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const album = await createGalleryAlbumService(payload);
    return NextResponse.json({ ok: true, album });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
