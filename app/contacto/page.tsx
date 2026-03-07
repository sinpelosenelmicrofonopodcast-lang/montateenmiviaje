import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { getCmsPageBundleService, getSiteSettingService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("contacto");
  const title = bundle.page?.seoTitle ?? "Contacto | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Canales directos para reservar tu próximo viaje.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: bundle.page?.seoOgImage ? [{ url: bundle.page.seoOgImage }] : undefined
    }
  };
}

export default async function ContactoPage() {
  const [bundle, contactSetting, socialSetting] = await Promise.all([
    getCmsPageBundleService("contacto"),
    getSiteSettingService("contact_info"),
    getSiteSettingService("social_links")
  ]);

  const contact = contactSetting?.value ?? {};
  const social = socialSetting?.value ?? {};

  const email = readString(contact.email, "hello@montateenmiviaje.com");
  const phone = readString(contact.phone, "+1 (555) 010-2026");
  const whatsapp = readString(contact.whatsapp, "+1 (555) 010-2026");
  const address = readString(contact.address, "Miami, FL");
  const hours = readString(contact.hours, "Lun-Vie 9:00-18:00");
  const mapEmbed = readString(contact.mapEmbed);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Contacto"}</p>
        <h1>{bundle.page?.heroTitle ?? "Hablemos de tu próximo viaje"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <section className="booking-shell">
        <article className="card">
          <h3>Canales directos</h3>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Teléfono:</strong> {phone}
          </p>
          <p>
            <strong>WhatsApp:</strong> {whatsapp}
          </p>
          <p>
            <strong>Dirección:</strong> {address}
          </p>
          <p>
            <strong>Horario:</strong> {hours}
          </p>
          <div className="button-row">
            {readString(social.instagram) ? (
              <a className="button-outline" href={readString(social.instagram)} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}
            {readString(social.tiktok) ? (
              <a className="button-outline" href={readString(social.tiktok)} target="_blank" rel="noreferrer">
                TikTok
              </a>
            ) : null}
            {readString(social.youtube) ? (
              <a className="button-outline" href={readString(social.youtube)} target="_blank" rel="noreferrer">
                YouTube
              </a>
            ) : null}
          </div>
        </article>

        <article className="card">
          <form>
            <label>
              Nombre
              <input placeholder="Tu nombre" />
            </label>
            <label>
              Correo
              <input type="email" placeholder="tu@email.com" />
            </label>
            <label>
              Mensaje
              <textarea rows={6} placeholder="Cuéntanos qué destino te interesa" />
            </label>
            <button className="button-dark" type="submit">
              Enviar
            </button>
          </form>
        </article>
      </section>

      {mapEmbed ? (
        <section className="section">
          <article className="card">
            <h3>Mapa</h3>
            <iframe
              title="Mapa de contacto"
              className="media-video"
              src={mapEmbed}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </article>
        </section>
      ) : null}

      <GenericSectionsRenderer sections={bundle.sections} />
    </main>
  );
}
