import Link from "next/link";
import { requireAdminServerAccess } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function DashboardAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminServerAccess();

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Admin</p>
        <h1>Dashboard administrativo</h1>
      </header>

      <nav className="button-row" style={{ marginBottom: "16px" }}>
        <Link className="button-outline" href="/dashboard/admin">
          Overview
        </Link>
        <Link className="button-outline" href="/dashboard/admin/users">
          Users
        </Link>
        <Link className="button-outline" href="/dashboard/admin/settings">
          Settings
        </Link>
      </nav>

      {children}
    </main>
  );
}
