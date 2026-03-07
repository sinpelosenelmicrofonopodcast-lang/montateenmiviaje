import { NextResponse } from "next/server";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { listTravelAuditLogsService, listTravelSearchSessionsService } from "@/lib/travel/services/travel-service";

export async function GET() {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const [searches, logs] = await Promise.all([
      listTravelSearchSessionsService(50),
      listTravelAuditLogsService(100)
    ]);
    return NextResponse.json({ searches, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
