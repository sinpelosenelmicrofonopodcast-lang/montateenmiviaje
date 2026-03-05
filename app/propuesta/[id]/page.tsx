import { notFound } from "next/navigation";
import { ProposalResponseForm } from "@/components/custom/proposal-response-form";
import { getCustomRequestBundle } from "@/lib/booking-store";
import { formatMoney } from "@/lib/format";

interface PropuestaPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PropuestaPage({ params }: PropuestaPageProps) {
  const { id } = await params;
  const bundle = getCustomRequestBundle(id);

  if (!bundle.request) {
    notFound();
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Paquete personalizado</p>
        <h1>{bundle.request.destination}</h1>
        <p className="section-subtitle">
          Estado: <strong>{bundle.request.status}</strong> · Solicitud #{bundle.request.id.slice(0, 8)}
        </p>
      </header>

      <section className="card">
        <h3>Solicitud del cliente</h3>
        <p>
          <strong>Nombre:</strong> {bundle.request.customerName}
        </p>
        <p>
          <strong>Email:</strong> {bundle.request.customerEmail}
        </p>
        <p>
          <strong>Fechas:</strong> {bundle.request.startDate} - {bundle.request.endDate}
        </p>
        <p>
          <strong>Personas:</strong> {bundle.request.travelers}
        </p>
        <p>
          <strong>Presupuesto:</strong> {formatMoney(bundle.request.budget)}
        </p>
        <p>
          <strong>Motivo:</strong> {bundle.request.motive}
        </p>
        <p>
          <strong>Expectativas:</strong> {bundle.request.expectations}
        </p>
      </section>

      {bundle.proposal ? (
        <section className="card section">
          <h2>{bundle.proposal.title}</h2>
          <p>{bundle.proposal.summary}</p>

          <h3>Itinerario sugerido</h3>
          <ul>
            {bundle.proposal.itinerary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="builder-cols">
            <div>
              <h3>Incluye</h3>
              <ul>
                {bundle.proposal.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>No incluye</h3>
              <ul>
                {bundle.proposal.excludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3>Precio y plan</h3>
          <p>Desde {formatMoney(bundle.proposal.pricePerPerson)} por persona</p>
          <p>Depósito: {formatMoney(bundle.proposal.deposit)}</p>
          <p>{bundle.proposal.paymentPlan}</p>
          <p className="muted">{bundle.proposal.notes}</p>

          <div className="button-row">
            <a className="button-primary" href={bundle.proposal.pdfUrl}>Descargar PDF</a>
          </div>
        </section>
      ) : (
        <section className="card section">
          <h3>Tu paquete aún está en preparación</h3>
          <p className="muted">El equipo admin está diseñando tu propuesta. Te llegará correo al estar lista.</p>
        </section>
      )}

      {bundle.proposal ? <ProposalResponseForm requestId={bundle.request.id} /> : null}

      {bundle.responses.length > 0 ? (
        <section className="card section">
          <h3>Historial de respuestas</h3>
          <ul>
            {bundle.responses.map((response) => (
              <li key={response.id}>
                <strong>{response.action === "accept" ? "Aceptado" : "Cambios solicitados"}</strong> · {response.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
