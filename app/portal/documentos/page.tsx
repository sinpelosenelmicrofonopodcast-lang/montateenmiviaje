import { getPortalBundle } from "@/lib/booking-store";

export const dynamic = "force-dynamic";

interface PortalDocumentosPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function PortalDocumentosPage({ searchParams }: PortalDocumentosPageProps) {
  const params = await searchParams;
  const bundle = getPortalBundle(params.email);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Documentos</h1>
      </header>
      <section className="card">
        <p className="muted">Brochures, itinerarios y documentos legales.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Idioma</th>
                <th>Fecha</th>
                <th>Descarga</th>
              </tr>
            </thead>
            <tbody>
              {bundle.documents.length === 0 ? (
                <tr>
                  <td colSpan={5}>Aún no hay documentos generados.</td>
                </tr>
              ) : (
                bundle.documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.title}</td>
                    <td>{document.audience}</td>
                    <td>{document.language}</td>
                    <td>{document.createdAt.slice(0, 10)}</td>
                    <td>
                      <a className="button-outline" href={document.downloadUrl}>Descargar</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
