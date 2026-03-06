import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalWalletPage() {
  await requirePortalSession();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Travel wallet (premium)</h1>
      </header>
      <section className="card">
        <p>Créditos disponibles: USD 0</p>
        <p className="muted">Aquí se gestionan créditos de referidos y add-ons prepagados.</p>
      </section>
    </main>
  );
}
