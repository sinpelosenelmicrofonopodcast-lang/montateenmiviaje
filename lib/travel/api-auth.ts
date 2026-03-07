import { NextResponse } from "next/server";
import { getServerAuthContext } from "@/lib/admin-guard";
import { hasTravelDeskRole, isAdminRole } from "@/lib/admin-auth";

export async function requireTravelDeskApiAccess() {
  const auth = await getServerAuthContext();
  if (!auth.user || !(isAdminRole(auth.role) || hasTravelDeskRole(auth.role))) {
    return {
      error: NextResponse.json({ message: "Permisos insuficientes para Travel Desk" }, { status: 403 })
    };
  }

  return { auth };
}
