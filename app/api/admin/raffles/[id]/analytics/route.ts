import { NextResponse } from "next/server";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getRaffleAdminSnapshotService, listRaffleReferralLeaderboardService } from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminServerAccess();
  try {
    const { id } = await params;
    const [snapshot, referrals] = await Promise.all([
      getRaffleAdminSnapshotService(id),
      listRaffleReferralLeaderboardService(id)
    ]);

    return NextResponse.json({
      metrics: snapshot.metrics,
      referrals
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
