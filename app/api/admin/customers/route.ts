import { NextResponse } from "next/server";
import { listCustomersService } from "@/lib/runtime-service";

export async function GET() {
  const customers = await listCustomersService();
  return NextResponse.json({ customers });
}
