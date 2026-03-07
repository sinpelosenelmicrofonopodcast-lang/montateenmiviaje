import { AdminOffersManager } from "@/components/custom/admin-offers-manager";
import Link from "next/link";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listOffersService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminOfertasPage() {
  await requireAdminServerAccess();
  const offers = await listOffersService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Ofertas y promociones</h1>
        <p className="section-subtitle">
          Crea códigos reales y controla su estado desde el dashboard.
        </p>
        <div className="button-row">
          <Link href="/ofertas" target="_blank" className="button-outline">
            Preview público
          </Link>
        </div>
      </header>
      <AdminOffersManager initialOffers={offers} />
    </main>
  );
}
