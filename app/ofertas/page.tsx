import { listOffersService } from "@/lib/catalog-service";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OfertasPage() {
  const offers = await listOffersService({ activeOnly: true });

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Promociones activas</p>
        <h1>Ofertas</h1>
        <p className="section-subtitle">
          Todas las ofertas aquí son gestionadas desde el dashboard admin y salen directo de base de datos.
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
              Valor:{" "}
              <strong>
                {offer.discountType === "percent" ? `${offer.value}%` : formatMoney(offer.value)}
              </strong>
            </p>
            {offer.tripSlug ? <p className="muted">Aplica a: {offer.tripSlug}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
