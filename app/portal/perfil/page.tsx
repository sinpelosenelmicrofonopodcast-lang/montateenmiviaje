import { PortalProfileManager } from "@/components/custom/portal/portal-profile-manager";
import { getPortalGrowthBundleService } from "@/lib/growth-service";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalPerfilPage() {
  const session = await requirePortalSession();
  const bundle = await getPortalGrowthBundleService(session.user.id, session.email);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Mi perfil</h1>
        <p className="section-subtitle">Datos personales y preferencias para agilizar reservas y cotizaciones.</p>
      </header>

      <PortalProfileManager
        initialProfile={bundle.profile}
        initialPreferences={bundle.preferences}
        initialOnboarding={bundle.onboarding}
      />
    </main>
  );
}
