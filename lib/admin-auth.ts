import type { User } from "@supabase/supabase-js";

const ADMIN_ROLE = "admin";

export function isAdminUser(user: User | null) {
  if (!user) {
    return false;
  }

  const role = user.app_metadata?.role;
  if (typeof role === "string" && role.toLowerCase() === ADMIN_ROLE) {
    return true;
  }

  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles)) {
    return roles.some((item) => typeof item === "string" && item.toLowerCase() === ADMIN_ROLE);
  }

  return false;
}
