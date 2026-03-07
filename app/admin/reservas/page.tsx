import { formatMoney } from "@/lib/format";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getPipelineSummaryService, listBookingsService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  lead: "Lead",
  contactado: "Contactado",
  reservado: "Reservado",
  deposito_pagado: "Depósito",
  pagado_parcial: "Pagado parcial",
  pagado_total: "Pagado total",
  completado: "Completado",
  cancelado: "Cancelado"
};

export default async function AdminReservasPage() {
  await requireAdminServerAccess();
  const [pipeline, bookings] = await Promise.all([getPipelineSummaryService(), listBookingsService()]);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Pipeline de reservas</h1>
      </header>

      <section className="kpi-grid">
        {Object.entries(pipeline).map(([stage, count]) => (
          <article key={stage} className="admin-card">
            <p className="kpi-title">{stageLabels[stage]}</p>
            <h3 className="kpi-value">{count}</h3>
          </article>
        ))}
      </section>

      <section className="card section">
        <h3>Reservas recientes</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Viaje</th>
                <th>Estado</th>
                <th>Depósito</th>
                <th>Balance</th>
                <th>Creación</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <strong>{booking.customerName}</strong>
                    <p className="muted">{booking.customerEmail}</p>
                  </td>
                  <td>{booking.tripSlug}</td>
                  <td>
                    <span className="status-badge status-pending">{stageLabels[booking.status]}</span>
                  </td>
                  <td>{formatMoney(booking.amount)}</td>
                  <td>{formatMoney(booking.balanceAmount)}</td>
                  <td>{booking.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
