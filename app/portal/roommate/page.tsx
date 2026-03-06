import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalRoommatePage() {
  await requirePortalSession();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Roommate matching (premium)</h1>
      </header>
      <section className="card">
        <p className="muted">Preferencias para emparejar roommate en viajes con habitación compartida.</p>
        <label>
          Perfil deseado
          <select>
            <option>Mismo rango de edad</option>
            <option>Preferencia no fumador</option>
            <option>Sin preferencia</option>
          </select>
        </label>
        <button className="button-dark" type="button">Guardar preferencias</button>
      </section>
    </main>
  );
}
