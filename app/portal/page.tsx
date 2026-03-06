import Link from "next/link";
import { PortalLogoutButton } from "@/components/custom/portal-logout-button";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

const modules = [
  { href: "/portal/mis-viajes", label: "Mis viajes", helper: "Itinerario y estado" },
  { href: "/portal/pagos", label: "Estado de pago", helper: "Depósito y cuotas" },
  { href: "/portal/documentos", label: "Documentos", helper: "PDFs y requisitos" },
  { href: "/portal/checklist", label: "Checklist", helper: "Preparación pre-viaje" },
  { href: "/portal/soporte", label: "Soporte", helper: "Canal privado" },
  { href: "/portal/roommate", label: "Roommate matching", helper: "Opcional premium" },
  { href: "/portal/wallet", label: "Travel wallet", helper: "Opcional premium" }
];

export default async function PortalPage() {
  const session = await requirePortalSession();

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Portal Cliente</p>
        <h1>Tu espacio privado</h1>
        <p className="section-subtitle">{session.email}</p>
        <PortalLogoutButton />
      </header>
      <section className="portal-grid">
        {modules.map((module) => (
          <article key={module.href} className="card">
            <h3>{module.label}</h3>
            <p className="muted">{module.helper}</p>
            <Link className="button-dark" href={module.href}>
              Abrir
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
