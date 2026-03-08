import { NextResponse } from "next/server";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listRaffleAdminLogsService } from "@/lib/raffles-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminServerAccess();
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.max(Math.min(Number(searchParams.get("limit") ?? "120") || 120, 500), 1);

    const logs = await listRaffleAdminLogsService(id, limit);
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
