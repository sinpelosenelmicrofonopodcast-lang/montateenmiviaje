import { NextResponse } from "next/server";
import {
  getDashboardSnapshotService,
  getPipelineSummaryService,
  getTripRevenueRowsService
} from "@/lib/runtime-service";

export async function GET() {
  const [snapshot, pipeline, revenueByTrip] = await Promise.all([
    getDashboardSnapshotService(),
    getPipelineSummaryService(),
    getTripRevenueRowsService()
  ]);

  return NextResponse.json({
    snapshot,
    pipeline,
    revenueByTrip
  });
}
