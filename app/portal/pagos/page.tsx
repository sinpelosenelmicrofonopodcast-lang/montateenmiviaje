import { formatMoney } from "@/lib/format";
import { requirePortalSession } from "@/lib/portal-auth";
import { getPortalBundleForAuthUserService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function PortalPagosPage() {
  const session = await requirePortalSession();
  const bundle = await getPortalBundleForAuthUserService(session.user.id, session.email);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Estado de pago</h1>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Viaje</th>
                <th>Monto</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bundle.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.paymentType}</td>
                  <td>{payment.tripSlug}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.dueDate ?? "-"}</td>
                  <td>
                    <span className={`status-badge ${payment.status === "paid" ? "status-paid" : "status-pending"}`}>
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
