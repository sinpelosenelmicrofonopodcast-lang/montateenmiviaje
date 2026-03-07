import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/admin-auth";
import { getServerAuthContext } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getServerAuthContext();

  if (!auth.user) {
    redirect("/portal/login");
  }

  if (isAdminRole(auth.role)) {
    redirect("/admin");
  }

  redirect("/portal");
}
