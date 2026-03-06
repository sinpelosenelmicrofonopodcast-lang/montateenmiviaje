import { listChecklistItemsService } from "@/lib/catalog-service";

export default async function PortalChecklistPage() {
  const checklistTemplate = await listChecklistItemsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Checklist personalizado</h1>
      </header>
      <section className="card">
        <ul className="checklist">
          {checklistTemplate.map((item) => (
            <li key={item}>
              <input type="checkbox" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
