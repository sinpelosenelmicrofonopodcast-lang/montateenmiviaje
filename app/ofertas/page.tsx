import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { listOffersService } from "@/lib/catalog-service";
import { getCmsPageBundleService } from "@/lib/cms-service";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("ofertas");
  const title = bundle.page?.seoTitle ?? "Ofertas | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Promociones y descuentos activos para viajes grupales premium.";

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

export default async function OfertasPage() {
  const [bundle, offers] = await Promise.all([
    getCmsPageBundleService("ofertas"),
    listOffersService({ activeOnly: true })
  ]);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Promociones"}</p>
        <h1>{bundle.page?.heroTitle ?? "Ofertas activas"}</h1>
        <p className="section-subtitle">
          {bundle.page?.heroSubtitle ??
            "Todas las promociones se gestionan desde dashboard admin y se publican automáticamente."}
        </p>
      </header>

      <section className="stack-grid">
        {offers.map((offer) => (
          <article key={offer.id} className="card">
            <p className="chip">{offer.discountType === "percent" ? "Descuento %" : "Descuento fijo"}</p>
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
            <p>
              Código: <strong>{offer.code}</strong>
            </p>
            <p>
              Valor: <strong>{offer.discountType === "percent" ? `${offer.value}%` : formatMoney(offer.value)}</strong>
            </p>
            {offer.tripSlug ? <p className="muted">Aplica a: {offer.tripSlug}</p> : null}
          </article>
        ))}
      </section>

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
