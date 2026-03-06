import Image from "next/image";
import { listGalleryBundlesService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const bundles = await listGalleryBundlesService();

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Galería Premium</p>
        <h1>Álbum por viaje</h1>
      </header>

      <section className="stack-grid">
        {bundles.map(({ album, media: albumMedia }) => {

          return (
            <article key={album.id} className="card">
              <h3>{album.title}</h3>
              <p className="muted">{album.tripSlug}</p>

              <div className="media-grid">
                {albumMedia.map((media) =>
                  media.type === "photo" ? (
                    <figure key={media.id} className="media-card">
                      <Image src={media.url} alt={media.caption} width={900} height={600} className="media-image" />
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
          );
        })}
      </section>
    </main>
  );
}
