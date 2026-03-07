import type { Metadata } from "next";
import { TripCard } from "@/components/trip-card";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { listTripsService } from "@/lib/catalog-service";
import { getCmsPageBundleService } from "@/lib/cms-service";

interface ViajesPageProps {
  searchParams: Promise<{ destination?: string; category?: string; month?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("viajes");
  const title = bundle.page?.seoTitle ?? "Viajes | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Explora viajes por destino, categoría y fechas.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: bundle.page?.seoOgImage ? [{ url: bundle.page.seoOgImage }] : undefined
    }
  };
}

export default async function ViajesPage({ searchParams }: ViajesPageProps) {
  const params = await searchParams;
  const [bundle, trips] = await Promise.all([
    getCmsPageBundleService("viajes"),
    listTripsService({ publishedOnly: true })
  ]);

  const destination = params.destination?.toLowerCase() ?? "";
  const category = params.category ?? "";
  const month = params.month ?? "";

  const filtered = trips.filter((trip) => {
    const matchesDestination = destination ? trip.destination.toLowerCase().includes(destination) : true;
    const matchesCategory = category ? trip.category === category : true;
    const matchesMonth = month ? trip.startDate.slice(0, 7) === month : true;
    return matchesDestination && matchesCategory && matchesMonth;
  });

  return (
    <main className="container">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Colección"}</p>
        <h1>{bundle.page?.heroTitle ?? "Viajes"}</h1>
        <p className="section-subtitle">
          {bundle.page?.heroSubtitle ??
            "Filtra por destino y categoría para encontrar la mejor experiencia grupal premium."}
        </p>
      </header>

      <form className="filter-row" method="GET">
        <label>
          Destino
          <input name="destination" placeholder="Ej: Dubai" defaultValue={params.destination ?? ""} />
        </label>
        <label>
          Categoría
          <select name="category" defaultValue={params.category ?? ""}>
            <option value="">Todas</option>
            <option value="Luxury">Luxury</option>
            <option value="Adventure">Adventure</option>
            <option value="Family">Family</option>
            <option value="Romantic">Romantic</option>
            <option value="Budget">Budget</option>
          </select>
        </label>
        <label>
          Mes
          <input type="month" name="month" defaultValue={params.month ?? ""} />
        </label>
        <label>
          Buscar
          <button className="button-dark" type="submit">
            Aplicar filtros
          </button>
        </label>
      </form>

      <section className="trip-grid section">
        {filtered.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </section>

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
