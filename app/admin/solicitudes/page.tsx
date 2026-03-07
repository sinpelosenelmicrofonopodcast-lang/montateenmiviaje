import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listCustomTripRequestsService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function AdminSolicitudesPage() {
  await requireAdminServerAccess();
  const requests = await listCustomTripRequestsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Solicitudes personalizadas</h1>
        <p className="section-subtitle">Lead → diseño de paquete → correo → aceptación/modificaciones.</p>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Destino</th>
                <th>Fechas</th>
                <th>Presupuesto</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.customerName}</strong>
                    <p className="muted">{request.customerEmail}</p>
                  </td>
                  <td>{request.destination}</td>
                  <td>{request.startDate} - {request.endDate}</td>
                  <td>{formatMoney(request.budget)}</td>
                  <td><span className="status-badge status-pending">{request.status}</span></td>
                  <td>
                    <Link className="button-dark" href={`/admin/solicitudes/${request.id}`}>
                      Crear/editar paquete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
