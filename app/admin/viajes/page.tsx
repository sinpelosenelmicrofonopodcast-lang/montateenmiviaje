import Link from "next/link";
import { trips } from "@/lib/data";
import { formatDateRange, formatMoney } from "@/lib/format";

export default function AdminViajesPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <h1>Gestión de viajes y paquetes</h1>
        <p className="section-subtitle">
          Publica viajes, ajusta itinerarios, duplica paquetes y genera PDFs cliente/interno.
        </p>
      </header>

      <section className="stack-grid">
        {trips.map((trip) => {
          const minPrice = Math.min(...trip.packages.map((pkg) => pkg.pricePerPerson));
          return (
            <article key={trip.id} className="card">
              <div className="table-head-row">
                <div>
                  <p className="chip">{trip.category}</p>
                  <h3>{trip.title}</h3>
                  <p className="muted">{trip.destination}</p>
                </div>
                <div className="right-info">
                  <p>{formatDateRange(trip.startDate, trip.endDate)}</p>
                  <p>Cupos: {trip.availableSpots}/{trip.totalSpots}</p>
                  <p>Desde {formatMoney(minPrice)}</p>
                </div>
              </div>

              <div className="tag-row">
                <span className="status-badge status-draft">Builder activo</span>
                <span className="status-badge status-paid">{trip.packages.length} paquetes</span>
                <span className="status-badge status-pending">{trip.addons.length} add-ons</span>
              </div>

              <div className="button-row">
                <Link className="button-dark" href={`/admin/viajes/${trip.slug}/builder`}>
                  Abrir builder
                </Link>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}>
                  PDF cliente
                </a>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=internal&lang=es&showPrices=true`}>
                  PDF interno
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
