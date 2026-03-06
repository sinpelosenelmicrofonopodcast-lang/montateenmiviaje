import { NextResponse } from "next/server";
import { listAutomationRulesService } from "@/lib/catalog-service";
import { listAutomationRunsService } from "@/lib/runtime-service";

export async function GET() {
  const [rules, runs] = await Promise.all([listAutomationRulesService(), listAutomationRunsService()]);
  return NextResponse.json({
    rules,
    runs
  });
}
