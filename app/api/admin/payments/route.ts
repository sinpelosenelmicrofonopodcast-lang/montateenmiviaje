import { NextResponse } from "next/server";
import { listPaymentsService } from "@/lib/runtime-service";

export async function GET() {
  const payments = await listPaymentsService();
  return NextResponse.json({ payments });
}
