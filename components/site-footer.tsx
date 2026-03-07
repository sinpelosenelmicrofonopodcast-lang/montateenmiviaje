import { getSiteSettingService } from "@/lib/cms-service";

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function SiteFooter() {
  const [identitySetting, contactSetting] = await Promise.all([
    getSiteSettingService("site_identity"),
    getSiteSettingService("contact_info")
  ]);

  const identity = identitySetting?.value ?? {};
  const contact = contactSetting?.value ?? {};

  const siteName = readString(identity.siteName, "Móntate en mi viaje");
  const tagline = readString(contact.tagline ?? identity.tagline, "Viajes grupales premium y experiencias internacionales.");
  const email = readString(contact.email, "hello@montateenmiviaje.com");
  const phone = readString(contact.phone, "+1 (555) 010-2026");

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">{siteName}</p>
          <p>{tagline}</p>
        </div>
        <div>
          <p className="footer-title">Contacto</p>
          <p>{email}</p>
          <p>{phone}</p>
        </div>
      </div>
    </footer>
  );
}
