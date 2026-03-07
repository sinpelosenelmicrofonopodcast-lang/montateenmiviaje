import { notFound } from "next/navigation";
import { BookingCheckout } from "@/components/booking-checkout";
import { getTripBySlugService } from "@/lib/catalog-service";
import { getSiteSettingService } from "@/lib/cms-service";
import { parsePaymentLinksSetting } from "@/lib/payment-links";

interface ReservarPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;
  const [trip, paymentSetting] = await Promise.all([
    getTripBySlugService(slug),
    getSiteSettingService("payment_links")
  ]);
  const paymentConfig = parsePaymentLinksSetting(paymentSetting);

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
        <p className="section-subtitle">Pago de depósito con PayPal y pay links alternos configurables por admin.</p>
      </header>
      <BookingCheckout trip={trip} paymentLinks={paymentConfig.methods} paymentNote={paymentConfig.note} />
    </main>
  );
}
