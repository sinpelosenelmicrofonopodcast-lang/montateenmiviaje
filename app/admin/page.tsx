import Link from "next/link";
import { listGalleryBundlesService, listOffersService, listTestimonialsService, listTripsService } from "@/lib/catalog-service";
import { formatMoney } from "@/lib/format";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { flattenAdminNav } from "@/lib/admin-navigation";
import { listRafflesService } from "@/lib/raffles-service";
import {
  getDashboardSnapshotService,
  listAutomationRunsService,
  listBookingsService,
  listPaymentsService
} from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

const modules = flattenAdminNav().filter((item) => item.href !== "/admin");

export default async function AdminOverviewPage() {
  await requireAdminServerAccess();
  const [snapshot, bookings, payments, runs, trips, offers, raffles, testimonials, galleryBundles] = await Promise.all([
    getDashboardSnapshotService(),
    listBookingsService(),
    listPaymentsService(),
    listAutomationRunsService(),
    listTripsService(),
    listOffersService(),
    listRafflesService({ includeDrafts: true, includeClosed: true }),
    listTestimonialsService(),
    listGalleryBundlesService()
  ]);

  const now = Date.now();
  const upcomingTrips = trips
    .filter((trip) => new Date(trip.startDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4);
  const activeOffers = offers.filter((offer) => offer.active);
  const activeRaffles = raffles.filter((raffle) => raffle.status === "published");
  const publishedTestimonials = testimonials.filter((item) => item.verified);
  const galleryImages = galleryBundles.reduce((sum, bundle) => sum + bundle.media.filter((media) => media.type === "photo").length, 0);
  const recentActivity = [...runs]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 5);

  const cards = [
    { title: "Ingresos cobrados", value: formatMoney(snapshot.totalRevenue) },
    { title: "Pendiente por cobrar", value: formatMoney(snapshot.pendingAmount) },
    { title: "Próximos viajes", value: String(upcomingTrips.length) },
    { title: "Reservas activas", value: String(bookings.length) },
    { title: "Pagos registrados", value: String(payments.length) },
    { title: "Ofertas activas", value: String(activeOffers.length) },
    { title: "Sorteos activos", value: String(activeRaffles.length) },
    { title: "Testimonios publicados", value: String(publishedTestimonials.length) },
    { title: "Imágenes en galería", value: String(galleryImages) },
    { title: "Conversión a pago", value: `${snapshot.conversionRate.toFixed(1)}%` }
  ];

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Dashboard</p>
        <h1>Panel administrativo integral</h1>
        <p className="section-subtitle">Operación, ventas, pagos y automatización desde un único lugar.</p>
      </header>

      <section className="kpi-grid">
        {cards.map((card) => (
          <article key={card.title} className="admin-card">
            <p className="kpi-title">{card.title}</p>
            <h3 className="kpi-value">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="admin-grid section">
        {modules.map((module) => (
          <article key={module.href} className="admin-card">
            <h3>{module.label}</h3>
            <p className="muted">{module.helper}</p>
            <Link className="button-outline" href={module.href}>
              Abrir módulo
            </Link>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="admin-grid">
          <article className="admin-card">
            <h3>Próximos viajes</h3>
            {upcomingTrips.length === 0 ? (
              <p className="muted">No hay viajes próximos publicados.</p>
            ) : (
              <ul>
                {upcomingTrips.map((trip) => (
                  <li key={trip.id}>
                    {trip.title} · {trip.startDate}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/viajes" className="button-outline">
              Gestionar viajes
            </Link>
          </article>

          <article className="admin-card">
            <h3>Actividad reciente</h3>
            {recentActivity.length === 0 ? (
              <p className="muted">Sin actividad de automatizaciones.</p>
            ) : (
              <ul>
                {recentActivity.map((item) => (
                  <li key={item.id}>
                    {item.ruleName} · {item.status} · {new Date(item.scheduledAt).toLocaleString("es-ES")}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/automatizaciones" className="button-outline">
              Ver automatizaciones
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
