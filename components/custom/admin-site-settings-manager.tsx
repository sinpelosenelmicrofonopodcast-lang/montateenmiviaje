"use client";

import { useMemo, useState } from "react";
import type { SiteSetting } from "@/lib/cms-service";

interface AdminSiteSettingsManagerProps {
  initialSettings: SiteSetting[];
}

function settingMap(settings: SiteSetting[]) {
  return new Map(settings.map((item) => [item.settingKey, item]));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function AdminSiteSettingsManager({ initialSettings }: AdminSiteSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mapped = useMemo(() => settingMap(settings), [settings]);
  const identity = mapped.get("site_identity")?.value ?? {};
  const contact = mapped.get("contact_info")?.value ?? {};
  const social = mapped.get("social_links")?.value ?? {};
  const tracking = mapped.get("tracking")?.value ?? {};

  async function refreshSettings() {
    const response = await fetch("/api/admin/cms/settings", { cache: "no-store" });
    const payload = (await response.json()) as { settings?: SiteSetting[]; message?: string };
    if (!response.ok || !payload.settings) {
      throw new Error(payload.message ?? "No se pudo refrescar settings");
    }

    setSettings(payload.settings);
  }

  async function saveSetting(settingKey: string, settingGroup: string, value: Record<string, unknown>) {
    const response = await fetch("/api/admin/cms/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settingKey, settingGroup, value })
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudo guardar setting");
    }

    await refreshSettings();
  }

  async function handleIdentitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      await saveSetting("site_identity", "branding", {
        siteName: asString(formData.get("siteName")),
        tagline: asString(formData.get("tagline")),
        logoUrl: asString(formData.get("logoUrl")),
        faviconUrl: asString(formData.get("faviconUrl")),
        ogImage: asString(formData.get("ogImage"))
      });
      setMessage("Branding guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      await saveSetting("contact_info", "contact", {
        email: asString(formData.get("email")),
        phone: asString(formData.get("phone")),
        whatsapp: asString(formData.get("whatsapp")),
        address: asString(formData.get("address")),
        hours: asString(formData.get("hours")),
        mapEmbed: asString(formData.get("mapEmbed"))
      });
      setMessage("Contacto global guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      await saveSetting("social_links", "social", {
        instagram: asString(formData.get("instagram")),
        tiktok: asString(formData.get("tiktok")),
        youtube: asString(formData.get("youtube")),
        facebook: asString(formData.get("facebook"))
      });
      setMessage("Redes sociales guardadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrackingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      await saveSetting("tracking", "analytics", {
        googleAnalyticsId: asString(formData.get("googleAnalyticsId")),
        metaPixelId: asString(formData.get("metaPixelId")),
        customHeadScript: asString(formData.get("customHeadScript"))
      });
      setMessage("Tracking guardado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack-grid">
      <form className="card request-grid" onSubmit={handleIdentitySubmit}>
        <h3 className="request-full">Branding</h3>
        <label>
          Site name
          <input name="siteName" defaultValue={asString(identity.siteName)} required />
        </label>
        <label>
          Tagline
          <input name="tagline" defaultValue={asString(identity.tagline)} />
        </label>
        <label>
          Logo URL
          <input name="logoUrl" defaultValue={asString(identity.logoUrl)} />
        </label>
        <label>
          Favicon URL
          <input name="faviconUrl" defaultValue={asString(identity.faviconUrl)} />
        </label>
        <label className="request-full">
          Open Graph image
          <input name="ogImage" defaultValue={asString(identity.ogImage)} />
        </label>
        <button className="button-dark request-full" type="submit" disabled={loading}>
          Guardar branding
        </button>
      </form>

      <form className="card request-grid" onSubmit={handleContactSubmit}>
        <h3 className="request-full">Contacto global</h3>
        <label>
          Email
          <input name="email" defaultValue={asString(contact.email)} required />
        </label>
        <label>
          Teléfono
          <input name="phone" defaultValue={asString(contact.phone)} />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" defaultValue={asString(contact.whatsapp)} />
        </label>
        <label>
          Dirección
          <input name="address" defaultValue={asString(contact.address)} />
        </label>
        <label>
          Horarios
          <input name="hours" defaultValue={asString(contact.hours)} />
        </label>
        <label className="request-full">
          Mapa embed URL
          <input name="mapEmbed" defaultValue={asString(contact.mapEmbed)} />
        </label>
        <button className="button-dark request-full" type="submit" disabled={loading}>
          Guardar contacto
        </button>
      </form>

      <form className="card request-grid" onSubmit={handleSocialSubmit}>
        <h3 className="request-full">Social links</h3>
        <label>
          Instagram
          <input name="instagram" defaultValue={asString(social.instagram)} />
        </label>
        <label>
          TikTok
          <input name="tiktok" defaultValue={asString(social.tiktok)} />
        </label>
        <label>
          YouTube
          <input name="youtube" defaultValue={asString(social.youtube)} />
        </label>
        <label>
          Facebook
          <input name="facebook" defaultValue={asString(social.facebook)} />
        </label>
        <button className="button-dark request-full" type="submit" disabled={loading}>
          Guardar redes
        </button>
      </form>

      <form className="card request-grid" onSubmit={handleTrackingSubmit}>
        <h3 className="request-full">Analytics y scripts</h3>
        <label>
          Google Analytics ID
          <input name="googleAnalyticsId" defaultValue={asString(tracking.googleAnalyticsId)} />
        </label>
        <label>
          Meta Pixel ID
          <input name="metaPixelId" defaultValue={asString(tracking.metaPixelId)} />
        </label>
        <label className="request-full">
          Script global (head)
          <textarea name="customHeadScript" rows={5} defaultValue={asString(tracking.customHeadScript)} />
        </label>
        <button className="button-dark request-full" type="submit" disabled={loading}>
          Guardar tracking
        </button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
