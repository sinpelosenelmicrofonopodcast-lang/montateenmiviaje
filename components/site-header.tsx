import Image from "next/image";
import Link from "next/link";
import { getServerAuthContext } from "@/lib/admin-guard";

const links = [
  { href: "/", label: "Home" },
  { href: "/viajes", label: "Viajes" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/sorteos", label: "Sorteos" },
  { href: "/registro", label: "Registro" },
  { href: "/solicitar-viaje", label: "Solicitar viaje" },
  { href: "/testimonios", label: "Testimonios" },
  { href: "/galeria", label: "Galería" },
  { href: "/about", label: "About" },
  { href: "/contacto", label: "Contacto" }
];

export async function SiteHeader() {
  const auth = await getServerAuthContext();
  const isLoggedIn = Boolean(auth.user);
  const isAdmin = auth.role === "admin";
  const navItems = [
    ...links,
    ...(isLoggedIn ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(isLoggedIn ? [{ href: "/portal", label: "Portal" }] : []),
    ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin" }] : [])
  ];

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand">
          <Image src="/logo-header.png" alt="Móntate en mi viaje" width={64} height={64} priority />
          <span className="brand-name">Móntate en mi viaje</span>
        </Link>

        <nav className="nav-links nav-links-desktop" aria-label="main navigation">
          {navItems.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="nav-mobile">
          <summary className="nav-mobile-trigger">Menú</summary>
          <nav className="nav-mobile-panel" aria-label="mobile navigation">
            {navItems.map((link) => (
              <Link key={link.href} href={link.href} className="nav-mobile-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
