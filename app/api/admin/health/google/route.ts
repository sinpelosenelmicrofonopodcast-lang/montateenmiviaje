import { NextResponse } from "next/server";
import { getServerAuthContext } from "@/lib/admin-guard";
import { isAdminRole } from "@/lib/admin-auth";
import { googleHealth, hgmGoogleReady } from "@/lib/hgm-google";

export const dynamic = "force-dynamic";
export async function GET() {
  // This diagnostic must never reveal credentials or sheet content to anonymous visitors.
  const auth = await getServerAuthContext();
  if (!auth.user || !isAdminRole(auth.role)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }
  if (!hgmGoogleReady()) {
    return NextResponse.json({
      ok: false, connected: false, code: "GOOGLE_SERVICE_ACCOUNT_NOT_CONFIGURED"
    }, { status: 503 });
  }
  try {
    const health = await googleHealth();
    return NextResponse.json({ ...health, connected: true });
  } catch (e) {
    const code = e instanceof Error ? e.message : "HGM_GOOGLE_UNKNOWN";
    return NextResponse.json({ ok: false, connected: false, code }, { status: 503 });
  }
}
