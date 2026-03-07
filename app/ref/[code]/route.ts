import { NextResponse } from "next/server";
import { trackReferralLinkClickService } from "@/lib/growth-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();
  const target = new URL(`/portal/register?ref=${encodeURIComponent(normalizedCode)}`, request.url);

  if (normalizedCode.length < 2) {
    return NextResponse.redirect(target);
  }

  try {
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ua = request.headers.get("user-agent") ?? "";
    await trackReferralLinkClickService(normalizedCode, {
      ua,
      forwarded_for_hash: forwardedFor ? forwardedFor.slice(0, 120) : null
    });
  } catch {
    // no-op: never block referral redirect because of analytics failure
  }

  const response = NextResponse.redirect(target);
  response.cookies.set({
    name: "mmv_ref",
    value: normalizedCode,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
