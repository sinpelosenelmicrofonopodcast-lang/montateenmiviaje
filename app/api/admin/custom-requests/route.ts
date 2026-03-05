import { NextResponse } from "next/server";
import { listCustomProposalResponses, listCustomTripRequests } from "@/lib/booking-store";

export async function GET() {
  return NextResponse.json({
    requests: listCustomTripRequests(),
    responses: listCustomProposalResponses()
  });
}
