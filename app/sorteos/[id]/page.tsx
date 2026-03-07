import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { RaffleCountdown } from "@/components/custom/raffle-countdown";
import { RaffleEntryForm } from "@/components/custom/raffle-entry-form";
import { getSiteSettingService } from "@/lib/cms-service";
import {
  getRaffleByIdService,
  getRafflePublicSummaryService,
  getRaffleVerificationPayloadService,
  listAvailableRaffleNumbersService,
  listPublicRaffleParticipantsService
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

  const [summary, participants, verification, availableNumbers] = await Promise.all([
    getRafflePublicSummaryService(id),
    listPublicRaffleParticipantsService(id),
    getRaffleVerificationPayloadService(id),
    listAvailableRaffleNumbersService(id)
  ]);

  const entriesCount = summary.metrics.confirmedEntries + summary.metrics.reservedNumbers;
  const confirmedCount = summary.metrics.confirmedEntries;
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
        <p><strong>Números disponibles:</strong> {summary.metrics.availableNumbers}</p>
        <p><strong>Números vendidos:</strong> {summary.metrics.soldNumbers}</p>
        <p><strong>Progreso de venta:</strong> {summary.metrics.progressPercent}%</p>
        <p><strong>Participaciones registradas:</strong> {entriesCount}</p>
        <p><strong>Participaciones confirmadas:</strong> {confirmedCount}</p>
        {raffle.urgencyMessage ? (
          <p>
            <strong>Mensaje:</strong> {raffle.urgencyMessage}
          </p>
        ) : null}
        {raffle.winnerNumber ? (
          <p>
            <strong>Número ganador:</strong> #{raffle.winnerNumber}
          </p>
        ) : null}
        {raffle.winnerCustomerEmail && raffle.publicWinnerName ? (
          <p>
            <strong>Ganador:</strong> {raffle.winnerCustomerEmail}
          </p>
        ) : null}
        <p className="muted">
          Si no estás registrado, primero ve a <Link href="/registro">/registro</Link>.
        </p>
      </section>

      {summary.publicNumbersVisibility ? (
        <section className="card">
          <h3>Números de la rifa</h3>
          <p className="muted">
            Modo público: <strong>{summary.publicGridMode}</strong>
          </p>
          {summary.publicGridMode === "totals_only" ? null : (
            <div className="raffle-number-grid">
              {summary.numbers.map((item) => (
                <span key={item.number} className={`raffle-number-pill raffle-number-${item.status}`}>
                  #{item.number}
                </span>
              ))}
            </div>
          )}
          <p className="muted">
            Vendidos: {summary.metrics.soldNumbers} · Reservados: {summary.metrics.reservedNumbers} · Bloqueados:{" "}
            {summary.metrics.blockedNumbers}
          </p>
        </section>
      ) : null}

      {participants.length > 0 ? (
        <section className="card">
          <h3>Participantes confirmados</h3>
          <div className="raffle-public-participants">
            {participants.map((participant) => (
              <p key={participant.entryId}>
                {participant.displayName}
                {typeof participant.chosenNumber === "number" ? ` · #${participant.chosenNumber}` : ""}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {verification ? (
        <section className="card">
          <h3>Verificación del sorteo</h3>
          <p><strong>Algoritmo:</strong> {verification.algorithm}</p>
          <p><strong>Seed pública:</strong> {verification.publicSeed ?? "-"}</p>
          <p><strong>Commit hash:</strong> {verification.commitHash ?? "-"}</p>
          <p><strong>Draw hash:</strong> {verification.drawHash ?? "-"}</p>
        </section>
      ) : null}

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
