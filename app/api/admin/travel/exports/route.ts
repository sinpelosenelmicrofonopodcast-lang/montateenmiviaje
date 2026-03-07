import { NextResponse } from "next/server";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { listTravelPdfExportsService } from "@/lib/travel/services/travel-service";

export async function GET() {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const exportsList = await listTravelPdfExportsService();
    return NextResponse.json({ exports: exportsList });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
