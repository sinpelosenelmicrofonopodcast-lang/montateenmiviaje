import Link from "next/link";
import { getServerAuthContext } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/format";
import { getPortalBundleForAuthUserService } from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getServerAuthContext();
  const bundle = auth.user
    ? await getPortalBundleForAuthUserService(auth.user.id, auth.email ?? undefined)
    : { customer: null, bookings: [], payments: [], documents: [] };
  const pendingPayments = bundle.payments.filter((payment) => payment.status === "pending" || payment.status === "overdue");
  const paidPayments = bundle.payments.filter((payment) => payment.status === "paid");
  const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Dashboard</p>
        <h1>Panel de usuario</h1>
        <p className="section-subtitle">
          Bienvenido{auth.email ? `, ${auth.email}` : ""}.
        </p>
      </header>

      <section className="kpi-grid">
        <article className="admin-card">
          <p className="kpi-title">Rol actual</p>
          <h3 className="kpi-value">{auth.role}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Mis viajes</p>
          <h3 className="kpi-value">{bundle.bookings.length}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Pagos pendientes</p>
          <h3 className="kpi-value">{formatMoney(totalPending)}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Pagos completados</p>
          <h3 className="kpi-value">{formatMoney(totalPaid)}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Documentos</p>
          <h3 className="kpi-value">{bundle.documents.length}</h3>
        </article>
      </section>

      <section className="card section">
        <h2>Accesos rápidos</h2>
        <div className="button-row">
          <Link className="button-outline" href="/portal/mis-viajes">
            Mis viajes
          </Link>
          <Link className="button-outline" href="/portal/pagos">
            Mis pagos
          </Link>
          <Link className="button-outline" href="/portal/documentos">
            Mis documentos
          </Link>
          {auth.role === "admin" ? (
            <Link className="button-dark" href="/dashboard/admin">
              Admin Panel
            </Link>
          ) : null}
        </div>
      </section>

      <section className="card section">
        <h2>Actividad reciente</h2>
        {bundle.bookings.length === 0 ? (
          <p className="muted">
            Aún no tienes viajes asociados. Puedes reservar en <Link href="/viajes">/viajes</Link> o solicitar uno a medida
            en <Link href="/solicitar-viaje"> /solicitar-viaje</Link>.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Viaje</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {bundle.bookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.tripSlug}</td>
                    <td>{booking.status}</td>
                    <td>{formatMoney(booking.totalAmount)}</td>
                    <td>{formatMoney(booking.balanceAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
