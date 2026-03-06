import { AdminOffersManager } from "@/components/custom/admin-offers-manager";
import { listOffersService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminOfertasPage() {
  const offers = await listOffersService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Ofertas y promociones</h1>
        <p className="section-subtitle">
          Crea códigos reales y controla su estado desde el dashboard.
        </p>
      </header>
      <AdminOffersManager initialOffers={offers} />
    </main>
  );
}
