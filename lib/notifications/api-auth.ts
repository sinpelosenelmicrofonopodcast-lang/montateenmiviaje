import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-auth";
import { getServerAuthContext } from "@/lib/admin-guard";
import { requirePortalApiSession } from "@/lib/portal-api-auth";

export async function requireNotificationAdminApiAccess() {
  const auth = await getServerAuthContext();

  if (!auth.user || !isAdminRole(auth.role)) {
    return {
      error: NextResponse.json({ message: "Permisos insuficientes para notificaciones" }, { status: 403 })
    };
  }

  return { auth };
}

export async function requireNotificationPortalApiAccess() {
  return requirePortalApiSession();
}
