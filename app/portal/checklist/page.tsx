import { checklistTemplate } from "@/lib/data";

export default function PortalChecklistPage() {
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
