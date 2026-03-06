import { requireAdminServerAccess } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function DashboardAdminPage() {
  const auth = await requireAdminServerAccess();

  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <p className="muted">Acceso restringido por middleware + validación server-side.</p>
      <p>
        Sesión activa: <strong>{auth.email ?? auth.user?.email ?? "admin"}</strong>
      </p>
    </section>
  );
}
