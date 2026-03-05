import { AdminRafflePanel } from "@/components/custom/admin-raffle-panel";
import { listRaffleEntries, listRaffles } from "@/lib/booking-store";

export const dynamic = "force-dynamic";

export default function AdminSorteosPage() {
  const raffles = listRaffles({ includeDrafts: true });
  const entries = listRaffleEntries();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Sorteos y rifas</h1>
        <p className="section-subtitle">
          Configura modalidad, pool de números, countdown y sorteo tipo lotería dentro del app.
        </p>
      </header>

      <AdminRafflePanel initialRaffles={raffles} initialEntries={entries} />
    </main>
  );
}
