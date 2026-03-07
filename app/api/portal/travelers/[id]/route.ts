import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTravelerProfileService, updateTravelerProfileService } from "@/lib/growth-service";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

const updateSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(2).optional(),
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
  travelerType: z.enum(["adult", "child", "infant"]).optional(),
  isDefault: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const { id } = await params;
    const payload = updateSchema.parse(await request.json());
    const traveler = await updateTravelerProfileService(auth.session.user.id, id, payload);

    if (!traveler) {
      return NextResponse.json({ message: "Viajero no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, traveler });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePortalApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const { id } = await params;
    const result = await deleteTravelerProfileService(auth.session.user.id, id);
    if (!result.deleted) {
      return NextResponse.json({ message: "Viajero no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
