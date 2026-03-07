import type { Metadata } from "next";
import Image from "next/image";
import { GenericSectionsRenderer } from "@/components/cms/generic-sections";
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

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">{bundle.page?.heroBadge ?? "Galería"}</p>
        <h1>{bundle.page?.heroTitle ?? "Álbum por viaje"}</h1>
        {bundle.page?.heroSubtitle ? <p className="section-subtitle">{bundle.page.heroSubtitle}</p> : null}
      </header>

      <section className="stack-grid">
        {bundles.map(({ album, media: albumMedia }) => (
          <article key={album.id} className="card">
            <h3>{album.title}</h3>
            <p className="muted">{album.tripSlug}</p>

            <div className="media-grid">
              {albumMedia.map((media) =>
                media.type === "photo" ? (
                  <figure key={media.id} className="media-card">
                    <Image
                      src={toPublicImageSrc(media.url)}
                      alt={media.caption}
                      width={900}
                      height={600}
                      className="media-image"
                      unoptimized
                    />
                    <figcaption>{media.caption}</figcaption>
                  </figure>
                ) : (
                  <figure key={media.id} className="media-card">
                    <iframe
                      className="media-video"
                      src={media.url}
                      title={media.caption}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                    <figcaption>{media.caption}</figcaption>
                  </figure>
                )
              )}
            </div>
          </article>
        ))}
      </section>

      <GenericSectionsRenderer sections={bundle.sections.filter((section) => section.sectionType !== "page_intro")} />
    </main>
  );
}
