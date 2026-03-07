import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalGrowthBundleService, updateUserProfileService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().min(7).max(40).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  stateRegion: z.string().trim().min(2).max(80).optional(),
  dateOfBirth: z.string().trim().min(4).max(20).optional(),
  preferredLanguage: z.enum(["es", "en"]).optional(),
  avatarUrl: z.string().trim().url().optional(),
  homeAirportCode: z.string().trim().min(3).max(6).optional(),
  marketingOptIn: z.boolean().optional()
});

export async function GET() {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const bundle = await getPortalGrowthBundleService(auth.session.user.id, auth.session.email);
    return NextResponse.json({
      profile: bundle.profile,
      preferences: bundle.preferences,
      onboarding: bundle.onboarding
    });
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
    const payload = profileSchema.parse(await request.json());
    const profile = await updateUserProfileService(auth.session.user.id, payload);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
