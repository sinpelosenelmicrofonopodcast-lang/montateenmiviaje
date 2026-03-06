import { notFound } from "next/navigation";
import { BookingCheckout } from "@/components/booking-checkout";
import { getTripBySlugService } from "@/lib/catalog-service";

interface ReservarPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;
  const trip = await getTripBySlugService(slug);

  if (!trip) {
    notFound();
  }

  if (trip.packages.length === 0) {
    return (
      <main className="container section">
        <header className="page-header">
          <p className="chip">Checkout seguro</p>
          <h1>Reservar {trip.title}</h1>
          <p className="section-subtitle">Este viaje aún no tiene paquetes de reserva activos.</p>
        </header>
      </main>
    );
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Checkout seguro</p>
        <h1>Reservar {trip.title}</h1>
        <p className="section-subtitle">Pago de depósito con PayPal. Sin Stripe en esta versión.</p>
      </header>
      <BookingCheckout trip={trip} />
    </main>
  );
}
