import type { AppRole } from "@/lib/admin-auth";
import type { TravelPermission } from "@/lib/travel/types";

const ALL_PERMISSIONS: TravelPermission[] = [
  "search_travel",
  "manage_quotes",
  "manage_packages",
  "export_pdfs",
  "attach_to_package",
  "view_travel_history"
];

const ROLE_PERMISSION_MAP: Record<AppRole, TravelPermission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  moderator: ALL_PERMISSIONS,
  travel_agent: ALL_PERMISSIONS,
  user: []
};

export function getTravelPermissionsForRole(role: AppRole) {
  return ROLE_PERMISSION_MAP[role] ?? [];
}

export function hasTravelPermission(role: AppRole, permission: TravelPermission) {
  return getTravelPermissionsForRole(role).includes(permission);
}
