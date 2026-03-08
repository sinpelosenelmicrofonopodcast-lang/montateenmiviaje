import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNotificationPortalApiAccess } from "@/lib/notifications/api-auth";
import {
  listUserNotificationsService,
  markAllNotificationsReadService
} from "@/lib/notifications/service";

const querySchema = z.object({
  kind: z.string().optional(),
  unreadOnly: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const patchSchema = z.object({
  action: z.enum(["mark_all_read"])
});

export async function GET(request: Request) {
  const auth = await requireNotificationPortalApiAccess();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      kind: searchParams.get("kind") ?? undefined,
      unreadOnly: searchParams.get("unreadOnly") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined
    });

    const data = await listUserNotificationsService(auth.session.user.id, {
      kind: parsed.kind,
      unreadOnly: parsed.unreadOnly === "true",
      limit: parsed.limit ?? 50,
      offset: parsed.offset ?? 0
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Query inválida", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireNotificationPortalApiAccess();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const payload = patchSchema.parse(await request.json());
    if (payload.action === "mark_all_read") {
      await markAllNotificationsReadService(auth.session.user.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ message: "Acción inválida" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
