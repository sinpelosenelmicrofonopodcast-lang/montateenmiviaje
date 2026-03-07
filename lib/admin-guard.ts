import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasTravelDeskRole, isAdminRole, isAdminUser, normalizeRole, type AppRole } from "@/lib/admin-auth";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface ProfileRoleRow {
  id: string;
  email: string | null;
  role: string | null;
}

async function resolveProfileRoleRow(
  user: User,
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient> | null,
  supabaseServer: Awaited<ReturnType<typeof getSupabaseServerClient>>
) {
  const byId = hasSupabaseConfig() && supabaseAdmin
    ? await supabaseAdmin
        .from("profiles")
        .select("id,email,role")
        .eq("id", user.id)
        .maybeSingle<ProfileRoleRow>()
    : await supabaseServer
        .from("profiles")
        .select("id,email,role")
        .eq("id", user.id)
        .maybeSingle<ProfileRoleRow>();

  if (!byId.error && byId.data) {
    return byId.data;
  }

  if (user.email) {
    const byEmail = hasSupabaseConfig() && supabaseAdmin
      ? await supabaseAdmin
          .from("profiles")
          .select("id,email,role")
          .eq("email", user.email.toLowerCase())
          .maybeSingle<ProfileRoleRow>()
      : await supabaseServer
          .from("profiles")
          .select("id,email,role")
          .eq("email", user.email.toLowerCase())
          .maybeSingle<ProfileRoleRow>();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data;
    }
  }

  return null;
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

  const adminClient = hasSupabaseConfig() ? getSupabaseAdminClient() : null;
  const profileRow = await resolveProfileRoleRow(user, adminClient, supabase);
  const resolvedRole = normalizeRole(profileRow?.role);
  return {
    user,
    role: resolvedRole === "user" && isAdminUser(user) ? "admin" : resolvedRole,
    email: profileRow?.email ?? user.email ?? null
  };
}

export async function requireAdminServerAccess() {
  const context = await getServerAuthContext();

  if (!context.user || !isAdminRole(context.role)) {
    redirect("/");
  }

  return context;
}

export async function requireTravelDeskServerAccess() {
  const context = await getServerAuthContext();

  if (!context.user || !(isAdminRole(context.role) || hasTravelDeskRole(context.role))) {
    redirect("/");
  }

  return context;
}
