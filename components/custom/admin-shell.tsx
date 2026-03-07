"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/custom/admin-logout-button";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/viajes", label: "Viajes" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/sorteos", label: "Sorteos" },
  { href: "/admin/testimonios", label: "Testimonios" },
  { href: "/admin/galeria", label: "Galería" },
  { href: "/admin/travel", label: "Travel Desk" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/documentos", label: "Documentos" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/automatizaciones", label: "Automatizaciones" },
  { href: "/admin/configuracion", label: "Configuración" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout-shell">
      <aside className="admin-sidebar card">
        <p className="chip">Admin</p>
        <h3>Panel de control</h3>
        <nav className="admin-sidebar-nav">
          {adminLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={active ? "admin-sidebar-link active" : "admin-sidebar-link"}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>{children}</div>
      <AdminLogoutButton />
    </div>
  );
}
