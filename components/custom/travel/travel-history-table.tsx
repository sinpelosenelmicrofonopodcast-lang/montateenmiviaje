import type { TravelAuditLog, TravelSearchSession } from "@/lib/travel/types";

interface TravelHistoryTableProps {
  searches: TravelSearchSession[];
  logs: TravelAuditLog[];
}

export function TravelHistoryTable({ searches, logs }: TravelHistoryTableProps) {
  return (
    <section className="card">
      <h3>Historial Travel Ops</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Actor</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((session) => (
              <tr key={`search-${session.id}`}>
                <td>Búsqueda {session.searchType}</td>
                <td>
                  {session.origin ? `${session.origin} → ` : ""}
                  {session.destination ?? "N/A"} · resultados: {session.resultCount}
                </td>
                <td>{session.createdBy ?? "N/A"}</td>
                <td>{new Date(session.createdAt).toLocaleString("es-ES")}</td>
              </tr>
            ))}
            {logs.map((log) => (
              <tr key={`log-${log.id}`}>
                <td>{log.entityType}</td>
                <td>{log.action}</td>
                <td>{log.actorId ?? "N/A"}</td>
                <td>{new Date(log.createdAt).toLocaleString("es-ES")}</td>
              </tr>
            ))}
            {searches.length === 0 && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Sin historial por ahora.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
