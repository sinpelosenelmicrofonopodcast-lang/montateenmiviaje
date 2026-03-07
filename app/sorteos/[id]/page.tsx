import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { RaffleCountdown } from "@/components/custom/raffle-countdown";
import { RaffleEntryForm } from "@/components/custom/raffle-entry-form";
import { getSiteSettingService } from "@/lib/cms-service";
import {
  getRaffleByIdService,
  listAvailableRaffleNumbersService,
  listRaffleEntriesService
} from "@/lib/raffles-service";
import { formatMoney } from "@/lib/format";
import { parsePaymentLinksSetting } from "@/lib/payment-links";

interface SorteoDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SorteoDetailPage({ params }: SorteoDetailPageProps) {
  const { id } = await params;
  const [raffle, paymentSetting] = await Promise.all([
    getRaffleByIdService(id),
    getSiteSettingService("payment_links")
  ]);
  const paymentConfig = parsePaymentLinksSetting(paymentSetting);

  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const entries = await listRaffleEntriesService(id);
  const entriesCount = entries.length;
  const confirmedCount = entries.filter((entry) => entry.status === "confirmed").length;
  const availableNumbers = (await listAvailableRaffleNumbersService(id)) ?? [];
  const canParticipate = raffle.status === "published" && !raffle.drawnAt;

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{canParticipate ? "Sorteo activo" : "Sorteo cerrado"}</p>
        <h1>{raffle.title}</h1>
        <p className="section-subtitle">{raffle.description}</p>
      </header>

      <RaffleCountdown drawAt={raffle.drawAt} drawnAt={raffle.drawnAt} winnerNumber={raffle.winnerNumber} />

      <section className="card">
        <p><strong>Premio:</strong> {raffle.prize}</p>
        <p><strong>Modalidad:</strong> {raffle.isFree ? "Gratis" : "Pago"}</p>
        <p><strong>Costo de entrada:</strong> {raffle.isFree ? "Sin costo" : formatMoney(raffle.entryFee)}</p>
        <p><strong>Requisitos:</strong> {raffle.requirements}</p>
        {!raffle.isFree ? <p><strong>Dónde pagar:</strong> {raffle.paymentInstructions}</p> : null}
        {!raffle.isFree && paymentConfig.methods.length > 0 ? (
          <PaymentMethodLinks methods={paymentConfig.methods} note={paymentConfig.note} title="Pay links disponibles" />
        ) : null}
        <p><strong>Ventana:</strong> {raffle.startDate} - {raffle.endDate}</p>
        <p><strong>Anuncio del ganador:</strong> {new Date(raffle.drawAt).toLocaleString("es-ES")}</p>
        <p><strong>Números totales:</strong> {raffle.numberPoolSize}</p>
        <p><strong>Números disponibles:</strong> {availableNumbers.length}</p>
        <p><strong>Participaciones registradas:</strong> {entriesCount}</p>
        <p><strong>Participaciones confirmadas:</strong> {confirmedCount}</p>
        {raffle.winnerNumber ? (
          <p>
            <strong>Número ganador:</strong> #{raffle.winnerNumber}
          </p>
        ) : null}
        {raffle.winnerCustomerEmail ? (
          <p>
            <strong>Ganador:</strong> {raffle.winnerCustomerEmail}
          </p>
        ) : null}
        <p className="muted">
          Si no estás registrado, primero ve a <Link href="/registro">/registro</Link>.
        </p>
      </section>

      {canParticipate ? (
        <RaffleEntryForm
          raffleId={raffle.id}
          isFree={raffle.isFree}
          paymentInstructions={raffle.paymentInstructions}
          paymentLinks={paymentConfig.methods}
          paymentNote={paymentConfig.note}
          initialAvailableNumbers={availableNumbers}
        />
      ) : null}
    </main>
  );
}
