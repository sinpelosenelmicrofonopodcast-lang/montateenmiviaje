import { NextResponse } from "next/server";
import { listCustomProposalResponsesService, listCustomTripRequestsService } from "@/lib/runtime-service";

export async function GET() {
  const [requests, responses] = await Promise.all([
    listCustomTripRequestsService(),
    listCustomProposalResponsesService()
  ]);

  return NextResponse.json({
    requests,
    responses
  });
}
