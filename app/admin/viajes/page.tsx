import { AdminTripsManager } from "@/components/custom/admin-trips-manager";
import { listTripsService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminViajesPage() {
  const trips = await listTripsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Gestión de viajes y paquetes</h1>
        <p className="section-subtitle">
          Publica viajes, ajusta itinerarios, duplica paquetes y genera PDFs cliente/interno.
        </p>
      </header>

      <AdminTripsManager initialTrips={trips} />
    </main>
  );
}
