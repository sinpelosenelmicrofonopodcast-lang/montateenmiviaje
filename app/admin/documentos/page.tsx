import { listDocumentsService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function AdminDocumentosPage() {
  const docs = await listDocumentsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Documentos</h1>
        <p className="section-subtitle">Brochures PDF y documentos generados automáticamente.</p>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Entidad</th>
                <th>Tipo</th>
                <th>Idioma</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aún no hay documentos. Genera PDF desde Viajes.</td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.title}</td>
                    <td>{doc.entityType}</td>
                    <td>{doc.audience}</td>
                    <td>{doc.language}</td>
                    <td>{doc.createdAt.slice(0, 10)}</td>
                    <td>
                      <a className="button-outline" href={doc.downloadUrl}>Descargar</a>
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
