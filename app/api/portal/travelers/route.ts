import { NextResponse } from "next/server";
import { z } from "zod";
import { createTravelerProfileService, listTravelerProfilesService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const createSchema = z.object({
  firstName: z.string().trim().min(2),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(2),
  dateOfBirth: z.string().trim().min(4).optional(),
  gender: z.string().trim().optional(),
  relationshipToUser: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  passportNumber: z.string().trim().optional(),
  passportIssuingCountry: z.string().trim().optional(),
  passportExpirationDate: z.string().trim().optional(),
  knownTravelerNumber: z.string().trim().optional(),
  redressNumber: z.string().trim().optional(),
  specialAssistanceNotes: z.string().trim().optional(),
  mealPreferences: z.string().trim().optional(),
  seatPreferences: z.string().trim().optional(),
  travelerType: z.enum(["adult", "child", "infant"]),
  isDefault: z.boolean().optional()
});

export async function GET() {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const travelers = await listTravelerProfilesService(auth.session.user.id);
    return NextResponse.json({ travelers });
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
    const payload = createSchema.parse(await request.json());
    const traveler = await createTravelerProfileService(auth.session.user.id, payload);
    return NextResponse.json({ ok: true, traveler });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
