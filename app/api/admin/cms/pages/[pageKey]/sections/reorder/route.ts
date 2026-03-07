import { NextResponse } from "next/server";
import { z } from "zod";
import { reorderPageSectionsService } from "@/lib/cms-service";

const schema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1)
});

interface RouteParams {
  params: Promise<{ pageKey: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { pageKey } = await params;
    const payload = schema.parse(await request.json());
    const result = await reorderPageSectionsService(pageKey, payload.sectionIds);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
