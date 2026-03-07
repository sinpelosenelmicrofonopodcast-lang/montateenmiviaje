import { listAutomationRulesService } from "@/lib/catalog-service";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listAutomationRunsService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function AdminAutomatizacionesPage() {
  await requireAdminServerAccess();
  const [runs, automationRules] = await Promise.all([
    listAutomationRunsService(),
    listAutomationRulesService()
  ]);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Automatizaciones</h1>
      </header>

      <section className="stack-grid">
        {automationRules.map((rule) => (
          <article key={rule.id} className="card">
            <h3>{rule.name}</h3>
            <p className="muted">Trigger: {rule.triggerEvent}</p>
            <p>Canal: {rule.channel}</p>
            <p>Status: {rule.active ? "Activo" : "Inactivo"}</p>
          </article>
        ))}
      </section>

      <section className="card section">
        <h3>Ejecuciones recientes</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Regla</th>
                <th>Canal</th>
                <th>Destinatario</th>
                <th>Entidad</th>
                <th>Programado</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.ruleName}</td>
                  <td>{run.channel}</td>
                  <td>{run.recipient}</td>
                  <td>{run.entityType}</td>
                  <td>{run.scheduledAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
