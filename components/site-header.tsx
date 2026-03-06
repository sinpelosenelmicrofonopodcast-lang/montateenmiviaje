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
          {isLoggedIn ? <Link href="/dashboard">Dashboard</Link> : null}
          {isLoggedIn ? <Link href="/portal">Portal</Link> : null}
          {isAdmin ? <Link href="/dashboard/admin">Admin</Link> : null}
        </nav>
      </div>
    </header>
  );
}
