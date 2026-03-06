import Link from "next/link";
import { getServerAuthContext } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getServerAuthContext();

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Dashboard</p>
        <h1>Panel de usuario</h1>
        <p className="section-subtitle">
          Bienvenido{auth.email ? `, ${auth.email}` : ""}.
        </p>
      </header>

      <section className="card">
        <p>Este es tu dashboard general.</p>
        {auth.role === "admin" ? (
          <Link className="button-dark" href="/dashboard/admin">
            Admin Panel
          </Link>
        ) : null}
      </section>
    </main>
  );
}
