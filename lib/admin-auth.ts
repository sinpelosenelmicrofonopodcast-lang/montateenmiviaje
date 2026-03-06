import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "manager" | "user";

const ADMIN_ROLE = "admin";
const FALLBACK_ROLE: AppRole = "user";
const VALID_ROLES = new Set<AppRole>(["admin", "manager", "user"]);

export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) {
    return FALLBACK_ROLE;
  }

  const normalized = role.toLowerCase().trim() as AppRole;
  return VALID_ROLES.has(normalized) ? normalized : FALLBACK_ROLE;
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeRole(role) === ADMIN_ROLE;
}

export function isAdminUser(user: User | null) {
  if (!user) {
    return false;
  }

  const role = user.app_metadata?.role;
  if (typeof role === "string" && isAdminRole(role)) {
    return true;
  }

  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles)) {
    return roles.some((item) => typeof item === "string" && isAdminRole(item));
  }

  return false;
}
