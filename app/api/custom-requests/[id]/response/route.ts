import { NextResponse } from "next/server";
import { z } from "zod";
import { respondCustomProposalService } from "@/lib/runtime-service";

const schema = z.object({
  action: z.enum(["accept", "changes"]),
  message: z.string().min(2)
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = schema.parse(await request.json());
    const result = await respondCustomProposalService(id, payload.action, payload.message);

    return NextResponse.json({
      ok: true,
      requestStatus: result.request.status,
      responseId: result.response.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("no encontrada") || message.includes("no hay") ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
