import type { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "manager" | "moderator" | "travel_agent" | "user";

const FALLBACK_ROLE: AppRole = "user";
const VALID_ROLES = new Set<AppRole>(["super_admin", "admin", "manager", "moderator", "travel_agent", "user"]);
const ADMIN_ROLES = new Set<AppRole>(["super_admin", "admin"]);
const TRAVEL_DESK_ROLES = new Set<AppRole>(["super_admin", "admin", "moderator", "travel_agent", "manager"]);

export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) {
    return FALLBACK_ROLE;
  }

  const normalized = role.toLowerCase().trim() as AppRole;
  return VALID_ROLES.has(normalized) ? normalized : FALLBACK_ROLE;
}

export function isAdminRole(role: string | null | undefined) {
  return ADMIN_ROLES.has(normalizeRole(role));
}

export function hasTravelDeskRole(role: string | null | undefined) {
  return TRAVEL_DESK_ROLES.has(normalizeRole(role));
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
