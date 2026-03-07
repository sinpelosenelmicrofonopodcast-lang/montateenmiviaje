import { AdminSiteSettingsManager } from "@/components/custom/admin-site-settings-manager";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listSiteSettingsService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  await requireAdminServerAccess();
  const settings = await listSiteSettingsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Configuración global</h1>
        <p className="section-subtitle">
          Gestiona branding, contacto, social, favicon, logo y campos de analytics sin tocar código.
        </p>
      </header>

      <AdminSiteSettingsManager initialSettings={settings} />
    </main>
  );
}
