import Link from "next/link";
import { isAdminRole } from "@/lib/admin-auth";
import { getServerAuthContext } from "@/lib/admin-guard";
import { getSiteSettingService } from "@/lib/cms-service";
import { toPublicImageSrc } from "@/lib/image-url";

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
  { href: "/contacto", label: "Contacto" },
  { href: "/faq", label: "FAQ" }
];

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function SiteHeader() {
  const [auth, identitySetting] = await Promise.all([
    getServerAuthContext(),
    getSiteSettingService("site_identity")
  ]);
  const identity = identitySetting?.value ?? {};
  const siteName = readString(identity.siteName, "Móntate en mi viaje");
  const logoUrl = toPublicImageSrc(readString(identity.logoUrl, "/logo-header.png"), "/logo-header.png");
  const isLoggedIn = Boolean(auth.user);
  const isAdmin = isAdminRole(auth.role);
  const navItems = [
    ...links,
    ...(isLoggedIn && !isAdmin ? [{ href: "/portal", label: "Portal" }] : []),
    ...(isLoggedIn && isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    ...(isLoggedIn ? [{ href: "/dashboard", label: "Mi panel" }] : [])
  ];

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <div className="brand-row">
          <Link href="/" className="brand">
            <img src={logoUrl} alt={siteName} width={64} height={64} className="brand-logo" />
            <span className="brand-name">{siteName}</span>
          </Link>
        </div>

        <nav className="nav-links nav-links-desktop" aria-label="main navigation">
          {navItems.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="nav-links nav-links-mobile" aria-label="mobile navigation">
          {navItems.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
