import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNotificationPortalApiAccess } from "@/lib/notifications/api-auth";
import { markNotificationReadService } from "@/lib/notifications/service";

const patchSchema = z.object({
  read: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireNotificationPortalApiAccess();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const { id } = await params;
    const payload = patchSchema.parse(await request.json());
    const result = await markNotificationReadService(auth.session.user.id, id, payload.read);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
