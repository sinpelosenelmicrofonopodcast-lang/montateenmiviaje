import type { Metadata } from "next";
import { HomeSectionsRenderer } from "@/components/cms/home-sections";
import { getCmsPageBundleService } from "@/lib/cms-service";
import { listOffersService, listTestimonialsService, listTripsService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("home");
  const title = bundle.page?.seoTitle ?? "Móntate en mi viaje | Viajes grupales premium";
  const description =
    bundle.page?.seoDescription ?? "Viajes grupales premium, reservas con PayPal y experiencias internacionales curadas.";
  const ogImage = bundle.page?.seoOgImage || bundle.page?.heroImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined
    }
  };
}

export default async function HomePage() {
  const [bundle, trips, testimonials, offers] = await Promise.all([
    getCmsPageBundleService("home"),
    listTripsService({ publishedOnly: true, featuredOnly: true }),
    listTestimonialsService({ approvedOnly: true }),
    listOffersService({ activeOnly: true })
  ]);

  return (
    <main>
      <HomeSectionsRenderer
        sections={bundle.sections}
        trips={trips}
        offers={offers}
        testimonials={testimonials}
      />
    </main>
  );
}
