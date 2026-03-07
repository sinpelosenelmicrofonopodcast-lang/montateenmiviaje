import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { getCmsPageBundleService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("faq");
  const title = bundle.page?.seoTitle ?? "FAQ | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Preguntas frecuentes sobre reservas, pagos y operación.";

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

export default async function FaqPage() {
  const bundle = await getCmsPageBundleService("faq");

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "FAQ"}</p>
        <h1>{bundle.page?.heroTitle ?? "Preguntas frecuentes"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <GenericSectionsRenderer sections={bundle.sections} />
    </main>
  );
}
