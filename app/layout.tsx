import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";

export const metadata: Metadata = {
  title: "Móntate en mi viaje",
  description: "Viajes grupales premium y experiencias internacionales",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: ["/favicon.png"]
  }
};

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
