import { NextResponse } from "next/server";
import { z } from "zod";
import { listSitePagesService, upsertSitePageService } from "@/lib/cms-service";

const pageSchema = z.object({
  pageKey: z.string().min(2),
  label: z.string().min(2).optional(),
  slug: z.string().min(1).optional(),
  heroBadge: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImage: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoOgImage: z.string().optional()
});

export async function GET() {
  try {
    const pages = await listSitePagesService();
    return NextResponse.json({ pages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = pageSchema.parse(await request.json());
    const page = await upsertSitePageService(payload.pageKey, payload);
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
