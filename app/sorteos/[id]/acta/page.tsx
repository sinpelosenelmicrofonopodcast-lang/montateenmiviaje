import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaffleByIdService, listPublicRaffleParticipantsService, verifyRaffleDrawService } from "@/lib/raffles-service";

interface SorteoCertificatePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function formatDate(value?: string) {
  if (!value) return "Pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PR");
}

export default async function SorteoCertificatePage({ params }: SorteoCertificatePageProps) {
  const { id } = await params;
  const raffle = await getRaffleByIdService(id);
  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const [verification, participants] = await Promise.all([
    verifyRaffleDrawService(id),
    listPublicRaffleParticipantsService(id)
  ]);
  const winnerName = raffle.winnerNumber
    ? participants.find((item) => item.chosenNumber === raffle.winnerNumber)?.displayName ?? "Participante"
    : "Pendiente";

  return (
    <main className="container section">
      <section className="card">
        <p className="chip">Acta del sorteo</p>
        <h1>{raffle.title}</h1>
        <p className="muted">Documento de validación pública del resultado.</p>

        <div className="request-grid">
          <article>
            <strong>ID rifa:</strong>
            <p className="muted">{raffle.id}</p>
          </article>
          <article>
            <strong>Estado:</strong>
            <p className="muted">{raffle.verificationStatus ?? raffle.status}</p>
          </article>
          <article>
            <strong>Cierre:</strong>
            <p className="muted">{formatDate(verification.payload.salesClosedAt ?? raffle.drawAt)}</p>
          </article>
          <article>
            <strong>Draw:</strong>
            <p className="muted">{formatDate(raffle.drawnAt)}</p>
          </article>
          <article>
            <strong>Número ganador:</strong>
            <p className="muted">{typeof raffle.winnerNumber === "number" ? `#${raffle.winnerNumber}` : "Pendiente"}</p>
          </article>
          <article>
            <strong>Ganador:</strong>
            <p className="muted">{winnerName}</p>
          </article>
        </div>

        <hr />

        <div className="request-grid">
          <article>
            <strong>Algoritmo</strong>
            <p className="muted">{verification.payload.algorithm}</p>
          </article>
          <article>
            <strong>Versión</strong>
            <p className="muted">{verification.payload.verificationVersion ?? "sha256-modulo-v1"}</p>
          </article>
          <article className="request-full">
            <strong>Commit hash</strong>
            <p className="muted">{verification.payload.commitHash ?? "Pendiente"}</p>
          </article>
          <article className="request-full">
            <strong>Draw hash</strong>
            <p className="muted">{verification.payload.drawHash ?? "Pendiente"}</p>
          </article>
          <article className="request-full">
            <strong>Clave revelada</strong>
            <p className="muted">{verification.payload.revealSecret ?? "Pendiente"}</p>
          </article>
        </div>

        <div className="button-row">
          <a className="button-dark" href={`/api/raffles/${raffle.id}/certificate`} target="_blank" rel="noreferrer">
            Descargar acta (JSON)
          </a>
          <Link href={`/sorteos/${raffle.id}`} className="button-outline">
            Volver al sorteo
          </Link>
        </div>
      </section>
    </main>
  );
}
