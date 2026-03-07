import { NextResponse } from "next/server";
import { z } from "zod";
import { listSiteSettingsService, upsertSiteSettingService } from "@/lib/cms-service";

const patchSchema = z.object({
  settingKey: z.string().min(2),
  settingGroup: z.string().min(2),
  value: z.record(z.any())
});

export async function GET() {
  try {
    const settings = await listSiteSettingsService();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = patchSchema.parse(await request.json());
    const setting = await upsertSiteSettingService(payload.settingKey, {
      settingGroup: payload.settingGroup,
      value: payload.value
    });

    return NextResponse.json({ ok: true, setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
