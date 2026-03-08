import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNotificationPortalApiAccess } from "@/lib/notifications/api-auth";
import {
  getUserNotificationPreferencesService,
  updateUserNotificationPreferencesService
} from "@/lib/notifications/service";

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  marketingPushEnabled: z.boolean().optional(),
  marketingEmailEnabled: z.boolean().optional(),
  transactionalPushEnabled: z.boolean().optional(),
  transactionalEmailEnabled: z.boolean().optional(),
  rafflePushEnabled: z.boolean().optional(),
  raffleEmailEnabled: z.boolean().optional(),
  tripPushEnabled: z.boolean().optional(),
  tripEmailEnabled: z.boolean().optional(),
  paymentPushEnabled: z.boolean().optional(),
  paymentEmailEnabled: z.boolean().optional()
});

export async function GET() {
  const auth = await requireNotificationPortalApiAccess();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const preferences = await getUserNotificationPreferencesService(auth.session.user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
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
    const payload = preferencesSchema.parse(await request.json());
    const preferences = await updateUserNotificationPreferencesService(auth.session.user.id, payload);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
