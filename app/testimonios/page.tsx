import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { listTestimonialsService } from "@/lib/catalog-service";
import { getCmsPageBundleService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("testimonios");
  const title = bundle.page?.seoTitle ?? "Testimonios | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Opiniones verificadas de clientes que viajaron con nosotros.";

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

export default async function TestimoniosPage() {
  const [bundle, testimonials] = await Promise.all([
    getCmsPageBundleService("testimonios"),
    listTestimonialsService({ approvedOnly: true })
  ]);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Social proof"}</p>
        <h1>{bundle.page?.heroTitle ?? "Testimonios verificados"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <section className="trip-grid">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "Pendiente"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
          </article>
        ))}
      </section>

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
