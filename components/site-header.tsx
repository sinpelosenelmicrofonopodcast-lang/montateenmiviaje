import Image from "next/image";
import Link from "next/link";
import { getPortalSessionContext } from "@/lib/portal-auth";

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
  const portalSession = await getPortalSessionContext();

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand">
          <Image src="/logo-header.png" alt="Móntate en mi viaje" width={64} height={64} priority />
          <span className="brand-name">Móntate en mi viaje</span>
        </Link>
        <nav className="nav-links" aria-label="main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {portalSession ? <Link href="/portal">Portal</Link> : null}
        </nav>
      </div>
    </header>
  );
}
