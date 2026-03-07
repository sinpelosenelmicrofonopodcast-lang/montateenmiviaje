import { NextResponse } from "next/server";
import { z } from "zod";
import { applyReferralCodeForUserService, getReferralDashboardService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const applySchema = z.object({
  referralCode: z.string().trim().min(2).max(64)
});

export async function GET() {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const referral = await getReferralDashboardService(auth.session.user.id);
    return NextResponse.json(referral);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const payload = applySchema.parse(await request.json());
    const result = await applyReferralCodeForUserService(auth.session.user.id, payload.referralCode);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
