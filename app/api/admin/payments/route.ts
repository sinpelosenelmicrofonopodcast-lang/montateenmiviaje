import { NextResponse } from "next/server";
import { listPayments } from "@/lib/booking-store";

export async function GET() {
  return NextResponse.json({ payments: listPayments() });
}
