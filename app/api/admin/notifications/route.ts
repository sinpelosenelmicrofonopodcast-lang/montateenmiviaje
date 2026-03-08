import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNotificationAdminApiAccess } from "@/lib/notifications/api-auth";
import {
  getAdminNotificationDashboardService,
  sendManualAdminNotificationService
} from "@/lib/notifications/service";

const querySchema = z.object({
  eventType: z.string().optional(),
  channel: z.enum(["push", "email", "inbox"]).optional(),
  status: z.enum(["pending", "sent", "delivered", "failed", "skipped"]).optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

const manualSchema = z.object({
  mode: z.enum(["broadcast", "targeted"]),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(1200),
  link: z.string().trim().optional(),
  audience: z.enum(["marketing", "transactional"]).optional(),
  channels: z.array(z.enum(["push", "email", "inbox"])).min(1).max(3).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  emails: z.array(z.string().email()).optional()
});

export async function GET(request: Request) {
  const access = await requireNotificationAdminApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      eventType: searchParams.get("eventType") ?? undefined,
      channel: searchParams.get("channel") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });

    const dashboard = await getAdminNotificationDashboardService(parsed);
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Query inválida", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireNotificationAdminApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = manualSchema.parse(await request.json());
    if (payload.mode === "targeted" && !(payload.userIds?.length || payload.emails?.length)) {
      return NextResponse.json(
        { message: "Para modo targeted debes enviar userIds o emails" },
        { status: 400 }
      );
    }

    const result = await sendManualAdminNotificationService({
      actorUserId: access.auth.user?.id,
      mode: payload.mode,
      title: payload.title,
      message: payload.message,
      link: payload.link?.trim() || undefined,
      audience: payload.audience ?? "marketing",
      channels: payload.channels,
      userIds: payload.userIds,
      emails: payload.emails
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
