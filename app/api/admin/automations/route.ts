import { NextResponse } from "next/server";
import { automationRules } from "@/lib/data";
import { listAutomationRuns } from "@/lib/booking-store";

export async function GET() {
  return NextResponse.json({
    rules: automationRules,
    runs: listAutomationRuns()
  });
}
