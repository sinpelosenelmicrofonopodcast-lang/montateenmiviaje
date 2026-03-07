import Link from "next/link";
import { isAdminRole } from "@/lib/admin-auth";
import { getServerAuthContext } from "@/lib/admin-guard";
import { getSiteSettingService } from "@/lib/cms-service";
import { toPublicImageSrc } from "@/lib/image-url";
import { HeaderLogoutButton } from "@/components/header-logout-button";

const primaryLinks = [
  { href: "/viajes", label: "Viajes" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/sorteos", label: "Sorteos" },
  { href: "/solicitar-viaje", label: "Solicitar viaje" },
  { href: "/testimonios", label: "Testimonios" },
  { href: "/galeria", label: "Galeria" },
  { href: "/contacto", label: "Contacto" }
];

const secondaryLinks = [
  { href: "/about", label: "About" },
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

  const accountLinks = isLoggedIn
    ? [
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [{ href: "/portal", label: "Portal" }]),
        { href: "/dashboard", label: "Mi panel" }
      ]
    : [
        { href: "/registro", label: "Registro" },
        { href: "/portal/login", label: "Login" }
      ];

  const mobileLinks = [...primaryLinks, ...secondaryLinks, ...accountLinks];

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <div className="brand-row">
          <Link href="/" className="brand" aria-label="Ir al inicio">
            <img src={logoUrl} alt={siteName} width={64} height={64} className="brand-logo" />
            <span className="brand-name">{siteName}</span>
          </Link>
        </div>

        <div className="nav-main">
          <nav className="nav-links nav-links-desktop" aria-label="main navigation">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            {secondaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link-secondary">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions nav-actions-desktop">
            {accountLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={index === accountLinks.length - 1 ? "nav-action-primary" : "nav-action-muted"}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? <HeaderLogoutButton className="nav-action-muted" /> : null}
          </div>
        </div>

        <nav className="nav-links nav-links-mobile" aria-label="mobile navigation">
          <Link href="/">Home</Link>
          {mobileLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? <HeaderLogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
