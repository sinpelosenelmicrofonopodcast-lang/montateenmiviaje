import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { getSiteSettingService } from "@/lib/cms-service";

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const [identitySetting, contactSetting] = await Promise.all([
    getSiteSettingService("site_identity"),
    getSiteSettingService("contact_info")
  ]);

  const identity = identitySetting?.value ?? {};
  const contact = contactSetting?.value ?? {};
  const title = readString(identity.siteName, "Móntate en mi viaje");
  const description = readString(
    identity.tagline ?? contact.tagline,
    "Viajes grupales premium y experiencias internacionales"
  );
  const favicon = readString(identity.faviconUrl, "/favicon.png");
  const ogImage = readString(identity.ogImage, "");

  return {
    title,
    description,
    icons: {
      icon: [{ url: favicon, type: "image/png" }],
      shortcut: [favicon],
      apple: [favicon]
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined
    }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
