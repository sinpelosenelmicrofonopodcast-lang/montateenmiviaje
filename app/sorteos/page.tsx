import type { Metadata } from "next";
import Link from "next/link";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { getCmsPageBundleService } from "@/lib/cms-service";
import { formatMoney } from "@/lib/format";
import { listRafflesService } from "@/lib/raffles-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("sorteos");
  const title = bundle.page?.seoTitle ?? "Sorteos | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Sorteos y rifas con números únicos y countdown.";

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

export default async function SorteosPage() {
  const [bundle, raffles] = await Promise.all([
    getCmsPageBundleService("sorteos"),
    listRafflesService({ includeClosed: true })
  ]);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Sorteos"}</p>
        <h1>{bundle.page?.heroTitle ?? "Participa en premios y viajes"}</h1>
        <p className="section-subtitle">
          {bundle.page?.heroSubtitle ?? "Debes registrarte para participar en rifas y sorteos."}{" "}
          <Link href="/registro">/registro</Link>
        </p>
      </header>

      <section className="stack-grid">
        {raffles.map((raffle) => (
          <article key={raffle.id} className="card">
            <div className="table-head-row">
              <div>
                <h3>{raffle.title}</h3>
                <p className="muted">{raffle.description}</p>
              </div>
              <div className="right-info">
                <p>{raffle.isFree ? "Gratis" : "Pago"}</p>
                <p>{raffle.isFree ? "Entrada libre" : `Entrada ${formatMoney(raffle.entryFee)}`}</p>
              </div>
            </div>
            <p>
              <strong>Premio:</strong> {raffle.prize}
            </p>
            <p>
              <strong>Requisitos:</strong> {raffle.requirements}
            </p>
            <p>
              <strong>Números disponibles totales:</strong> {raffle.numberPoolSize}
            </p>
            <p>
              <strong>Anuncio ganador:</strong> {new Date(raffle.drawAt).toLocaleString("es-ES")}
            </p>
            {!raffle.isFree ? (
              <p>
                <strong>Pago:</strong> {raffle.paymentInstructions}
              </p>
            ) : null}
            <p className="muted">
              {raffle.startDate} - {raffle.endDate}
            </p>
            {raffle.winnerNumber ? (
              <p>
                <strong>Número ganador:</strong> #{raffle.winnerNumber}
              </p>
            ) : null}
            <Link className="button-dark" href={`/sorteos/${raffle.id}`}>
              {raffle.status === "published" ? "Ver detalle y participar" : "Ver resultado"}
            </Link>
          </article>
        ))}
      </section>

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
