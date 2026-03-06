import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface PortalSessionContext {
  user: User;
  email: string;
}

export async function getPortalSessionContext(): Promise<PortalSessionContext | null> {
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  return {
    user,
    email: user.email.toLowerCase().trim()
  };
}

export async function requirePortalSession() {
  const context = await getPortalSessionContext();
  if (!context) {
    redirect("/portal/login");
  }

  return context;
}
