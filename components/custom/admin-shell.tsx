"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/custom/admin-logout-button";
import { ADMIN_NAV_GROUPS, resolveAdminBreadcrumb } from "@/lib/admin-navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <>{children}</>;
  }

  const breadcrumb = resolveAdminBreadcrumb(pathname);

  return (
    <div className="admin-layout-shell">
      <aside className="admin-sidebar card">
        <p className="chip">Admin</p>
        <h3>Panel de control</h3>
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.key} className="admin-sidebar-group">
            <p className="admin-sidebar-group-title">{group.title}</p>
            <nav className="admin-sidebar-nav">
              {group.items.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.href} href={link.href} className={active ? "admin-sidebar-link active" : "admin-sidebar-link"}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </aside>
      <div>
        <section className="card" style={{ marginBottom: "12px" }}>
          <div className="table-head-row">
            <div>
              <p className="muted">
                <Link href={breadcrumb.root.href}>{breadcrumb.root.label}</Link>
                {breadcrumb.current ? ` / ${breadcrumb.current.label}` : ""}
              </p>
              {breadcrumb.current?.helper ? <p className="muted">{breadcrumb.current.helper}</p> : null}
            </div>
            <div className="button-row" style={{ marginTop: 0 }}>
              <Link className="button-outline" href="/" target="_blank">
                Ver sitio
              </Link>
              <Link className="button-outline" href="/portal" target="_blank">
                Ver portal
              </Link>
            </div>
          </div>
        </section>
        {children}
      </div>
      <AdminLogoutButton />
    </div>
  );
}
