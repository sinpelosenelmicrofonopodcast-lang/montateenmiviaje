import { notFound } from "next/navigation";
import { BookingCheckout } from "@/components/booking-checkout";
import { getTripBySlug } from "@/lib/data";

interface ReservarPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;
  const trip = getTripBySlug(slug);

  if (!trip) {
    notFound();
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
