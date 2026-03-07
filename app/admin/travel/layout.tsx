import Link from "next/link";
import { requireTravelDeskServerAccess } from "@/lib/admin-guard";
import { getTravelPermissionsForRole } from "@/lib/travel/permissions";

const tabs = [
  { href: "/admin/travel/flights", label: "Flights" },
  { href: "/admin/travel/hotels", label: "Hotels" },
  { href: "/admin/travel/quotes", label: "Quotes" },
  { href: "/admin/travel/packages", label: "Packages" },
  { href: "/admin/travel/exports", label: "Exports" }
];

export default async function AdminTravelLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireTravelDeskServerAccess();
  const permissions = getTravelPermissionsForRole(auth.role);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Travel Desk</p>
        <h1>Travel Operations</h1>
        <p className="section-subtitle">
          Búsquedas multi-fuente, cotizaciones, paquetes y exports PDF en un flujo interno unificado.
        </p>
        <p className="muted">
          Sesión: {auth.email ?? auth.user?.email ?? "admin"} · Rol: {auth.role} · Permisos: {permissions.join(", ")}
        </p>
      </header>

      <section className="card travel-tab-shell">
        <nav className="travel-tabs">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className="button-outline">
              {tab.label}
            </Link>
          ))}
        </nav>
      </section>

      {children}
    </main>
  );
}
