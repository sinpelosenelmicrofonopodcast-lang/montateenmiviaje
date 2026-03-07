import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface PortalApiSession {
  user: User;
  email: string;
}

export async function requirePortalApiSession() {
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return {
      error: NextResponse.json({ message: "Supabase no configurado" }, { status: 500 })
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      error: NextResponse.json({ message: "No autorizado" }, { status: 401 })
    };
  }

  return {
    session: {
      user,
      email: user.email.toLowerCase().trim()
    } satisfies PortalApiSession
  };
}
