import { galleryAlbums, galleryMedia } from "@/lib/data";

export default function AdminGaleriaPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <h1>Galería premium</h1>
      </header>

      <section className="stack-grid">
        {galleryAlbums.map((album) => {
          const items = galleryMedia.filter((media) => media.albumId === album.id);
          return (
            <article key={album.id} className="card">
              <h3>{album.title}</h3>
              <p className="muted">{album.tripSlug}</p>
              <p>{items.length} assets ({items.filter((item) => item.type === "video").length} videos)</p>
              <div className="button-row">
                <button className="button-dark" type="button">Subir foto/video</button>
                <button className="button-outline" type="button">Marcar featured</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
