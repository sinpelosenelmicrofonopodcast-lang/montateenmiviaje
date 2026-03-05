import { NextResponse } from "next/server";
import { getDashboardSnapshot, getPipelineSummary, getTripRevenueRows } from "@/lib/booking-store";

export async function GET() {
  return NextResponse.json({
    snapshot: getDashboardSnapshot(),
    pipeline: getPipelineSummary(),
    revenueByTrip: getTripRevenueRows()
  });
}
