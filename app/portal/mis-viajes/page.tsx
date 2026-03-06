import Link from "next/link";
import { listTripsService } from "@/lib/catalog-service";
import { formatDateRange, formatMoney } from "@/lib/format";
import { requirePortalSession } from "@/lib/portal-auth";
import { getPortalBundleForAuthUserService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function PortalMisViajesPage() {
  const session = await requirePortalSession();
  const [bundle, trips] = await Promise.all([
    getPortalBundleForAuthUserService(session.user.id, session.email),
    listTripsService()
  ]);
  const tripMap = new Map(trips.map((trip) => [trip.slug, trip]));

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Mis viajes</h1>
        <p className="section-subtitle">Cliente: {bundle.customer?.fullName ?? "Sin sesión"}</p>
      </header>

      <section className="stack-grid">
        {bundle.bookings.map((booking) => {
          const trip = tripMap.get(booking.tripSlug);
          if (!trip) {
            return null;
          }

          return (
            <article key={booking.id} className="card">
              <h3>{trip.title}</h3>
              <p className="muted">{trip.destination}</p>
              <p>{formatDateRange(trip.startDate, trip.endDate)}</p>
              <p>Estado: <span className="status-badge status-pending">{booking.status}</span></p>
              <p>Depósito: {formatMoney(booking.amount)} · Balance: {formatMoney(booking.balanceAmount)}</p>
              <div className="button-row">
                <Link className="button-outline" href={`/viajes/${trip.slug}`}>Ver itinerario</Link>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}>
                  Descargar PDF
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
