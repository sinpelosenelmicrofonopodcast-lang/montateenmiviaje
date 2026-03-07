import { NextResponse } from "next/server";
import { z } from "zod";
import { getCmsPageBundleService, upsertSitePageService } from "@/lib/cms-service";

const patchSchema = z.object({
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

interface RouteParams {
  params: Promise<{ pageKey: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { pageKey } = await params;
    const bundle = await getCmsPageBundleService(pageKey, {
      includeDraftPage: true,
      includeDraftSections: true
    });

    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { pageKey } = await params;
    const payload = patchSchema.parse(await request.json());
    const page = await upsertSitePageService(pageKey, payload);
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
