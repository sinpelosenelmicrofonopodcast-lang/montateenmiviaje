import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { getCmsPageBundleService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("about");
  const title = bundle.page?.seoTitle ?? "Sobre nosotros | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Historia, misión y visión de la marca.";

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

export default async function AboutPage() {
  const bundle = await getCmsPageBundleService("about");

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "About"}</p>
        <h1>{bundle.page?.heroTitle ?? "Sobre Móntate en mi viaje"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <GenericSectionsRenderer sections={bundle.sections} />
    </main>
  );
}
