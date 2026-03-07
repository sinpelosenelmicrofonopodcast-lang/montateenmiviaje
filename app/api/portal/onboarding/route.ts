import { NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardingProgressService, markOnboardingStepService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const schema = z.object({
  step: z.enum([
    "account_created",
    "email_verified",
    "basic_profile_completed",
    "traveler_added",
    "preferences_completed",
    "referral_prompt_seen",
    "first_quote_requested",
    "onboarding_completed"
  ])
});

export async function GET() {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const onboarding = await getOnboardingProgressService(auth.session.user.id);
    return NextResponse.json({ onboarding });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const payload = schema.parse(await request.json());
    const onboarding = await markOnboardingStepService(auth.session.user.id, payload.step);
    return NextResponse.json({ ok: true, onboarding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
