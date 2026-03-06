import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAdminRole, normalizeRole, type AppRole } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface ProfileRoleRow {
  id: string;
  email: string | null;
  role: string | null;
}

export interface ServerAuthContext {
  user: User | null;
  role: AppRole;
  email: string | null;
}

export async function getServerAuthContext(): Promise<ServerAuthContext> {
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return {
      user: null,
      role: "user",
      email: null
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      role: "user",
      email: null
    };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  if (profileResult.error) {
    return {
      user,
      role: "user",
      email: user.email ?? null
    };
  }

  return {
    user,
    role: normalizeRole(profileResult.data?.role),
    email: profileResult.data?.email ?? user.email ?? null
  };
}

export async function requireAdminServerAccess() {
  const context = await getServerAuthContext();

  if (!context.user || !isAdminRole(context.role)) {
    redirect("/");
  }

  return context;
}
