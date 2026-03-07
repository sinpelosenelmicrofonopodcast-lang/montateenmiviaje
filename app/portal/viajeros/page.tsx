import { PortalTravelersManager } from "@/components/custom/portal/portal-travelers-manager";
import { listTravelerProfilesService } from "@/lib/growth-service";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalViajerosPage() {
  const session = await requirePortalSession();
  const travelers = await listTravelerProfilesService(session.user.id);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Viajeros</h1>
        <p className="section-subtitle">Guarda perfiles de viajeros frecuentes y reutilízalos en cada reserva.</p>
      </header>

      <PortalTravelersManager initialTravelers={travelers} />
    </main>
  );
}
