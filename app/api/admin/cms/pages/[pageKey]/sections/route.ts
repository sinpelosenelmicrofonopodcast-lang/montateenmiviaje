import { NextResponse } from "next/server";
import { z } from "zod";
import { createPageSectionService, getCmsPageBundleService } from "@/lib/cms-service";

const createSchema = z.object({
  sectionKey: z.string().min(2),
  sectionType: z.string().min(2),
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
  params: Promise<{ pageKey: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { pageKey } = await params;
    const bundle = await getCmsPageBundleService(pageKey, {
      includeDraftPage: true,
      includeDraftSections: true
    });

    return NextResponse.json({ sections: bundle.sections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { pageKey } = await params;
    const payload = createSchema.parse(await request.json());
    const section = await createPageSectionService(pageKey, payload);
    return NextResponse.json({ ok: true, section });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
