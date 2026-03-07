import { getSiteSettingService } from "@/lib/cms-service";
import { TravelIcon } from "@/components/ui/travel-icons";
import { normalizeWhatsAppLink, readSocialLinks } from "@/lib/social-links";

export async function WhatsAppFloat() {
  const [contactSetting, socialSetting] = await Promise.all([
    getSiteSettingService("contact_info"),
    getSiteSettingService("social_links")
  ]);
  const contact = contactSetting?.value ?? {};
  const socialLinks = readSocialLinks(socialSetting?.value ?? contact.socials);
  const whatsappHref = normalizeWhatsAppLink(contact.whatsapp);

  if (!whatsappHref && socialLinks.length === 0) {
    return null;
  }

  return (
    <aside className="social-float-dock" aria-label="Redes sociales y contacto rápido">
      {socialLinks.map((item) => (
        <a
          key={item.key}
          className="social-float-link"
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${item.label}`}
          title={item.label}
        >
          <TravelIcon name={item.icon} className="social-float-icon" />
          <span>{item.label}</span>
        </a>
      ))}

      {whatsappHref ? (
        <a
          className="whatsapp-float"
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir WhatsApp"
          title="WhatsApp"
        >
          <TravelIcon name="whatsapp" className="social-float-icon" />
          <span>WhatsApp</span>
        </a>
      ) : null}
    </aside>
  );
}
