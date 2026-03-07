import { getSiteSettingService } from "@/lib/cms-service";
import Link from "next/link";
import { toPublicImageSrc } from "@/lib/image-url";

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readSocialLinks(value: unknown) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const raw = value as Record<string, unknown>;
  const list = [
    { label: "Instagram", url: typeof raw.instagram === "string" ? raw.instagram : "" },
    { label: "Facebook", url: typeof raw.facebook === "string" ? raw.facebook : "" },
    { label: "TikTok", url: typeof raw.tiktok === "string" ? raw.tiktok : "" },
    { label: "YouTube", url: typeof raw.youtube === "string" ? raw.youtube : "" }
  ];

  return list.filter((item) => item.url.trim());
}

export async function SiteFooter() {
  const [identitySetting, contactSetting] = await Promise.all([
    getSiteSettingService("site_identity"),
    getSiteSettingService("contact_info")
  ]);

  const identity = identitySetting?.value ?? {};
  const contact = contactSetting?.value ?? {};

  const siteName = readString(identity.siteName, "Móntate en mi viaje");
  const logoUrl = toPublicImageSrc(readString(identity.logoUrl, "/logo-header.png"), "/logo-header.png");
  const tagline = readString(contact.tagline ?? identity.tagline, "Viajes grupales premium y experiencias internacionales.");
  const email = readString(contact.email, "hello@montateenmiviaje.com");
  const phone = readString(contact.phone, "+1 (555) 010-2026");
  const whatsapp = readString(contact.whatsapp, "");
  const socials = readSocialLinks(contact.socials);
  const quickLinks = [
    { label: "Viajes", href: "/viajes" },
    { label: "Ofertas", href: "/ofertas" },
    { label: "Sorteos", href: "/sorteos" },
    { label: "Solicitar viaje", href: "/solicitar-viaje" }
  ];
  const legalLinks = [
    { label: "FAQ", href: "/faq" },
    { label: "About", href: "/about" },
    { label: "Contacto", href: "/contacto" },
    { label: "Registro", href: "/registro" }
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-row">
              <img src={logoUrl} alt={siteName} width={68} height={68} className="footer-brand-logo" />
              <div>
                <p className="footer-brand">{siteName}</p>
                <p className="footer-tagline">{tagline}</p>
              </div>
            </div>
            <div className="footer-socials">
              {socials.map((social) => (
                <a key={social.label} href={social.url} target="_blank" rel="noreferrer">
                  {social.label}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-columns">
            <div>
              <p className="footer-title">Explorar</p>
              <div className="footer-link-list">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="footer-title">Navegación</p>
              <div className="footer-link-list">
                {legalLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="footer-title">Contacto</p>
              <div className="footer-link-list">
                <a href={`mailto:${email}`}>{email}</a>
                <a href={`tel:${phone}`}>{phone}</a>
                {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> : null}
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {siteName}. Todos los derechos reservados.</p>
          <p>Premium Group Travel</p>
        </div>
      </div>
    </footer>
  );
}
