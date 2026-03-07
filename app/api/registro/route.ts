import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertRegistrationProfileService } from "@/lib/growth-service";
import { registerCustomerService } from "@/lib/raffles-service";

const schema = z.object({
  fullName: z.string().trim().min(2).optional(),
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  referralCode: z.string().trim().min(2).max(64).optional(),
  registrationSource: z.string().trim().min(2).max(80).optional(),
  authUserId: z.string().uuid().optional()
}).superRefine((value, ctx) => {
  const hasFullName = Boolean(value.fullName?.trim());
  const hasSplitNames = Boolean(value.firstName?.trim() && value.lastName?.trim());
  if (!hasFullName && !hasSplitNames) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fullName"],
      message: "Debes enviar fullName o firstName + lastName"
    });
  }
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const fullName = payload.fullName?.trim() || `${payload.firstName?.trim() ?? ""} ${payload.lastName?.trim() ?? ""}`.trim();
    const customer = await registerCustomerService(payload);
    const growth = payload.authUserId
      ? await upsertRegistrationProfileService({
          authUserId: payload.authUserId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          fullName,
          phone: payload.phone,
          country: payload.country,
          referralCode: payload.referralCode,
          registrationSource: payload.registrationSource
        })
      : { referralApplied: false };

    return NextResponse.json({
      ok: true,
      customerId: customer.id,
      isRegistered: customer.isRegistered,
      referralApplied: growth.referralApplied
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
