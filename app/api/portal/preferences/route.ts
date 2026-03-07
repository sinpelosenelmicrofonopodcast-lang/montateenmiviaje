import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalGrowthBundleService, upsertTravelerPreferencesService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const schema = z.object({
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  preferredDestinations: z.array(z.string().trim().min(1)).optional(),
  dreamDestinations: z.array(z.string().trim().min(1)).optional(),
  preferredAirlines: z.array(z.string().trim().min(1)).optional(),
  preferredHotelStyle: z.string().trim().min(2).optional(),
  preferredTripTypes: z.array(z.string().trim().min(1)).optional(),
  preferredDepartureAirports: z.array(z.string().trim().min(1)).optional(),
  typicalTripDurationDays: z.number().int().positive().optional(),
  preferredTravelMonths: z.array(z.number().int().min(1).max(12)).optional(),
  usuallyTravelsWith: z.string().trim().min(2).optional(),
  travelFrequencyPerYear: z.number().int().min(0).optional(),
  notes: z.string().trim().min(2).optional()
});

export async function GET() {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const bundle = await getPortalGrowthBundleService(auth.session.user.id, auth.session.email);
    return NextResponse.json({ preferences: bundle.preferences, onboarding: bundle.onboarding });
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
    const preferences = await upsertTravelerPreferencesService(auth.session.user.id, payload);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
