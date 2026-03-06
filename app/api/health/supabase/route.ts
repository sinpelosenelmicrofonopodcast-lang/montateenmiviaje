import { NextResponse } from "next/server";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        message: "Faltan variables NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
      },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("app_raffles").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, connected: false, message: `Supabase respondió con error: ${error.message}` },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ ok: false, connected: false, message }, { status: 503 });
  }
}
