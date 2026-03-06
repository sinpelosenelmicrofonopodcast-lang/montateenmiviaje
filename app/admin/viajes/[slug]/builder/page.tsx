import { notFound } from "next/navigation";
import { AdminTripBuilderManager } from "@/components/custom/admin-trip-builder-manager";
import { getTripBySlugService } from "@/lib/catalog-service";

interface BuilderPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function TripBuilderPage({ params }: BuilderPageProps) {
  const { slug } = await params;
  const trip = await getTripBySlugService(slug, { includeUnpublished: true });

  if (!trip) {
    notFound();
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Package Builder</p>
        <h1>{trip.title}</h1>
        <p className="section-subtitle">Core feature: construcción dinámica de paquete, itinerario y pricing.</p>
      </header>
      <AdminTripBuilderManager initialTrip={trip} />
    </main>
  );
}
