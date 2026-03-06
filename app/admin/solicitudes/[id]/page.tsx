import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProposalForm } from "@/components/custom/admin-proposal-form";
import { getCustomRequestBundleService, listEmailLogsService } from "@/lib/runtime-service";

interface AdminSolicitudDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminSolicitudDetailPage({ params }: AdminSolicitudDetailPageProps) {
  const { id } = await params;
  const bundle = await getCustomRequestBundleService(id);

  if (!bundle.request) {
    notFound();
  }

  const relatedEmails = (await listEmailLogsService()).filter((item) => item.to === bundle.request?.customerEmail);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Solicitud personalizada</p>
        <h1>{bundle.request.customerName}</h1>
        <p className="section-subtitle">{bundle.request.destination} · Estado {bundle.request.status}</p>
      </header>

      <section className="card">
        <h3>Brief del cliente</h3>
        <p>
          {bundle.request.travelers} personas · {bundle.request.startDate} - {bundle.request.endDate}
        </p>
        <p>
          <strong>Motivo:</strong> {bundle.request.motive}
        </p>
        <p>
          <strong>Expectativas:</strong> {bundle.request.expectations}
        </p>
        <p>
          <strong>Email:</strong> {bundle.request.customerEmail}
        </p>
      </section>

      <AdminProposalForm
        requestId={bundle.request.id}
        customerName={bundle.request.customerName}
        destination={bundle.request.destination}
        travelers={bundle.request.travelers}
      />

      <section className="card section">
        <h3>Link cliente</h3>
        <Link className="button-outline" href={`/propuesta/${bundle.request.id}`}>
          Ver página de propuesta
        </Link>
        {bundle.proposal ? (
          <a className="button-outline" href={bundle.proposal.pdfUrl} style={{ marginLeft: "12px" }}>
            Abrir PDF generado
          </a>
        ) : null}
      </section>

      <section className="card section">
        <h3>Correos enviados</h3>
        {relatedEmails.length === 0 ? (
          <p className="muted">Aún no se envió notificación.</p>
        ) : (
          <ul>
            {relatedEmails.map((email) => (
              <li key={email.id}>
                {email.sentAt.slice(0, 16)} · {email.subject} · proveedor: {email.provider}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
