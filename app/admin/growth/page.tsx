import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getAdminGrowthSnapshotService } from "@/lib/growth-service";

export const dynamic = "force-dynamic";

function toPercent(base: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((base / total) * 100)}%`;
}

export default async function AdminGrowthPage() {
  await requireAdminServerAccess();
  const snapshot = await getAdminGrowthSnapshotService();
  const funnel = snapshot.funnel as Record<string, number> | null;

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Growth</p>
        <h1>Growth y onboarding</h1>
        <p className="section-subtitle">Funnel de activación, salud de perfiles y performance de referidos.</p>
      </header>

      <section className="kpi-grid">
        <article className="admin-card">
          <p className="kpi-title">Usuarios onboarding</p>
          <h3 className="kpi-value">{funnel?.total_users ?? 0}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Email verificado</p>
          <h3 className="kpi-value">{toPercent(Number(funnel?.email_verified ?? 0), Number(funnel?.total_users ?? 0))}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Onboarding completado</p>
          <h3 className="kpi-value">{toPercent(Number(funnel?.onboarding_completed ?? 0), Number(funnel?.total_users ?? 0))}</h3>
        </article>
        <article className="admin-card">
          <p className="kpi-title">Promedio completado</p>
          <h3 className="kpi-value">{funnel?.avg_completion_percentage ?? 0}%</h3>
        </article>
      </section>

      <section className="card section">
        <h2>Top referrers</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Código</th>
                <th>Clicks</th>
                <th>Signups</th>
                <th>Conversiones</th>
                <th>Rewards</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.referrals.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sin datos de referidos.</td>
                </tr>
              ) : (
                snapshot.referrals.map((item) => (
                  <tr key={`${item.user_id}-${item.referral_code}`}>
                    <td>{item.full_name || item.email || item.user_id}</td>
                    <td>{item.referral_code}</td>
                    <td>{item.clicks_count}</td>
                    <td>{item.signups_count}</td>
                    <td>{item.conversions_count}</td>
                    <td>USD {Number(item.reward_points_earned ?? 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card section">
        <h2>Perfiles con onboarding incompleto</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Completado</th>
                <th>Paso actual</th>
                <th>Viajeros</th>
                <th>Preferencias</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.profiles.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sin datos de perfiles.</td>
                </tr>
              ) : (
                snapshot.profiles.map((item) => (
                  <tr key={item.user_id}>
                    <td>{item.full_name || item.email}</td>
                    <td>{item.role}</td>
                    <td>{item.completion_percentage ?? 0}%</td>
                    <td>{item.current_step ?? "welcome"}</td>
                    <td>{item.travelers_count ?? 0}</td>
                    <td>{item.has_preferences ? "Sí" : "No"}</td>
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
