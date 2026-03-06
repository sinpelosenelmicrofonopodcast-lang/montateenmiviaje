import Link from "next/link";
import { listRafflesService } from "@/lib/raffles-service";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SorteosPage() {
  const raffles = await listRafflesService({ includeClosed: true });

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Sorteos y rifas</p>
        <h1>Participa en premios y viajes</h1>
        <p className="section-subtitle">
          Para participar debes registrarte primero en <Link href="/registro">/registro</Link>.
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
            <p><strong>Premio:</strong> {raffle.prize}</p>
            <p><strong>Requisitos:</strong> {raffle.requirements}</p>
            <p><strong>Números disponibles totales:</strong> {raffle.numberPoolSize}</p>
            <p><strong>Anuncio ganador:</strong> {new Date(raffle.drawAt).toLocaleString("es-ES")}</p>
            {!raffle.isFree ? (
              <p><strong>Pago:</strong> {raffle.paymentInstructions}</p>
            ) : null}
            <p className="muted">{raffle.startDate} - {raffle.endDate}</p>
            {raffle.winnerNumber ? <p><strong>Número ganador:</strong> #{raffle.winnerNumber}</p> : null}
            <Link className="button-dark" href={`/sorteos/${raffle.id}`}>
              {raffle.status === "published" ? "Ver detalle y participar" : "Ver resultado"}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
