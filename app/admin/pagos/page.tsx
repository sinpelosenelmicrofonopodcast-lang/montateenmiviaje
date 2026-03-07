import { formatMoney } from "@/lib/format";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listPaymentsService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function AdminPagosPage() {
  await requireAdminServerAccess();
  const payments = await listPaymentsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Pagos</h1>
        <p className="section-subtitle">Control de depósitos, cuotas y balance final con PayPal.</p>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Viaje</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.paymentType}</td>
                  <td>{payment.tripSlug}</td>
                  <td>{payment.customerEmail}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.dueDate ?? "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${payment.status === "paid" ? "status-paid" : "status-pending"}`}
                    >
                      {payment.status}
                    </span>
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
