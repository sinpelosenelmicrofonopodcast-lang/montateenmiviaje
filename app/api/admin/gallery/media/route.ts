import { NextResponse } from "next/server";
import { z } from "zod";
import { createGalleryMediaService } from "@/lib/catalog-service";

const schema = z.object({
  albumId: z.string().uuid(),
  type: z.enum(["photo", "video"]),
  url: z.string().url(),
  caption: z.string().min(2),
  sortOrder: z.number().int().min(0).optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const media = await createGalleryMediaService(payload);
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
