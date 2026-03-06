import { AdminRafflePanel } from "@/components/custom/admin-raffle-panel";
import { listRaffleEntriesService, listRafflesService } from "@/lib/raffles-service";

export const dynamic = "force-dynamic";

export default async function AdminSorteosPage() {
  const [raffles, entries] = await Promise.all([
    listRafflesService({ includeDrafts: true }),
    listRaffleEntriesService()
  ]);

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
