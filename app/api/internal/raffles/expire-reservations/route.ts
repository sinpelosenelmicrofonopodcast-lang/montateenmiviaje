import { NextResponse } from "next/server";
import { processExpiredRaffleReservationsService } from "@/lib/raffles-service";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const xCronSecret = request.headers.get("x-cron-secret") ?? "";

  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return xCronSecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processExpiredRaffleReservationsService({ force: true });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
