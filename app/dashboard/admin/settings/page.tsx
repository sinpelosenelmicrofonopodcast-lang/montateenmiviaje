import { requireAdminServerAccess } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function DashboardAdminSettingsPage() {
  await requireAdminServerAccess();

  return (
    <section className="card">
      <h2>Settings</h2>
      <p className="muted">Configuración de seguridad y permisos para administradores.</p>
      <ul>
        <li>Protección activa en middleware.</li>
        <li>Protección activa en layout server-side.</li>
        <li>RLS en `profiles` y módulos administrativos.</li>
      </ul>
    </section>
  );
}
