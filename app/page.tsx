import type { Metadata } from "next";
import { HomeSectionsRenderer } from "@/components/cms/home-sections";
import { getCmsPageBundleService } from "@/lib/cms-service";
import { listGalleryBundlesService, listOffersService, listTestimonialsService, listTripsService } from "@/lib/catalog-service";
import { getRafflePublicSummaryService, listRafflesService } from "@/lib/raffles-service";

export const dynamic = "force-dynamic";

async function safelyLoad<T>(label: string, action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch (error) {
    console.error(`Home page: failed to load ${label}`, error);
    return fallback;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await safelyLoad("SEO CMS", () => getCmsPageBundleService("home"), { page: null, sections: [] });
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
  // Each section is isolated so an outage in one catalog service cannot take down the entire homepage.
  const [bundle, trips, testimonials, offers, raffles, galleryBundles] = await Promise.all([
    safelyLoad("CMS", () => getCmsPageBundleService("home"), { page: null, sections: [] }),
    safelyLoad("trips", () => listTripsService({ publishedOnly: true }), []),
    safelyLoad("testimonials", () => listTestimonialsService({ approvedOnly: true }), []),
    safelyLoad("offers", () => listOffersService({ activeOnly: true }), []),
    safelyLoad("raffles", () => listRafflesService({ includeClosed: true }), []),
    safelyLoad("gallery", () => listGalleryBundlesService(), [])
  ]);
  const featuredRaffle = raffles.find((raffle) => raffle.status === "published") ?? raffles[0] ?? null;
  const featuredRaffleSummary = featuredRaffle
    ? await safelyLoad("featured raffle summary", () => getRafflePublicSummaryService(featuredRaffle.id), null)
    : null;

  return (
    <main>
      <HomeSectionsRenderer
        sections={bundle.sections}
        trips={trips}
        offers={offers}
        testimonials={testimonials}
        raffles={raffles}
        galleryBundles={galleryBundles}
        featuredRaffleSummary={featuredRaffleSummary}
      />
    </main>
  );
}
