import { listCustomers } from "@/lib/booking-store";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminCrmPage() {
  const customers = listCustomers();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>CRM de clientes</h1>
        <p className="section-subtitle">Notas internas, historial de viajes/pagos y preferencias.</p>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pipeline</th>
                <th>Reservas</th>
                <th>LTV</th>
                <th>Preferencias</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.fullName}</strong>
                    <p className="muted">{customer.email}</p>
                  </td>
                  <td>{customer.pipelineStage}</td>
                  <td>{customer.bookingsCount}</td>
                  <td>{formatMoney(customer.lifetimeValue)}</td>
                  <td>{customer.preferences.join(", ")}</td>
                  <td>{customer.notes.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
