import { NextResponse } from "next/server";
import { requireNotificationAdminApiAccess } from "@/lib/notifications/api-auth";
import { retryNotificationDeliveryService } from "@/lib/notifications/service";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireNotificationAdminApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const result = await retryNotificationDeliveryService(id, access.auth.user?.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
