import type { Metadata } from "next";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
import { GalleryExperience } from "@/components/custom/gallery-experience";
import { listGalleryBundlesService } from "@/lib/catalog-service";
import { getCmsPageBundleService } from "@/lib/cms-service";
import { toPublicImageSrc } from "@/lib/image-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await getCmsPageBundleService("galeria");
  const title = bundle.page?.seoTitle ?? "Galería | Móntate en mi viaje";
  const description = bundle.page?.seoDescription ?? "Fotos y videos de experiencias internacionales.";

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

export default async function GaleriaPage() {
  const [bundle, bundles] = await Promise.all([
    getCmsPageBundleService("galeria"),
    listGalleryBundlesService()
  ]);
  const albums = bundles.map(({ album, media }) => {
    const albumCover = toPublicImageSrc(album.coverImage, "/logo.png");
    return {
      id: album.id,
      tripSlug: album.tripSlug,
      title: album.title,
      coverImage: albumCover,
      featured: album.featured,
      items: media.map((item) => ({
        ...item,
        caption: item.caption?.trim() || album.title,
        url: item.type === "photo" ? toPublicImageSrc(item.url, albumCover) : item.url
      }))
    };
  });

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Galería"}</p>
        <h1>{bundle.page?.heroTitle ?? "Álbum por viaje"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <GalleryExperience albums={albums} />

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
