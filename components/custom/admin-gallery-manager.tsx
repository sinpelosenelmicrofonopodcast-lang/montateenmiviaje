"use client";

import { useState } from "react";
import { GalleryAlbumBundle } from "@/lib/catalog-service";

interface AdminGalleryManagerProps {
  initialBundles: GalleryAlbumBundle[];
}

export function AdminGalleryManager({ initialBundles }: AdminGalleryManagerProps) {
  const [bundles, setBundles] = useState(initialBundles);
  const [error, setError] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState({
    tripSlug: "",
    title: "",
    coverImage: "",
    featured: true
  });
  const [mediaForm, setMediaForm] = useState({
    albumId: "",
    type: "photo",
    url: "",
    caption: "",
    sortOrder: "0"
  });

  async function reload() {
    const response = await fetch("/api/admin/gallery/albums", { cache: "no-store" });
    const payload = (await response.json()) as { bundles?: GalleryAlbumBundle[]; message?: string };
    if (!response.ok || !payload.bundles) {
      throw new Error(payload.message ?? "No se pudo cargar galería");
    }
    setBundles(payload.bundles);
  }

  async function handleCreateAlbum(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(albumForm)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear álbum");
      }
      await reload();
      setAlbumForm({ tripSlug: "", title: "", coverImage: "", featured: true });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function handleCreateMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: mediaForm.albumId,
          type: mediaForm.type,
          url: mediaForm.url,
          caption: mediaForm.caption,
          sortOrder: Number(mediaForm.sortOrder)
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear media");
      }
      await reload();
      setMediaForm({ albumId: "", type: "photo", url: "", caption: "", sortOrder: "0" });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleCreateAlbum}>
        <h3 className="request-full">Crear álbum</h3>
        <label>
          Trip slug
          <input value={albumForm.tripSlug} onChange={(event) => setAlbumForm({ ...albumForm, tripSlug: event.target.value })} required />
        </label>
        <label>
          Título
          <input value={albumForm.title} onChange={(event) => setAlbumForm({ ...albumForm, title: event.target.value })} required />
        </label>
        <label className="request-full">
          Cover image URL
          <input value={albumForm.coverImage} onChange={(event) => setAlbumForm({ ...albumForm, coverImage: event.target.value })} required />
        </label>
        <label>
          Featured
          <select value={albumForm.featured ? "yes" : "no"} onChange={(event) => setAlbumForm({ ...albumForm, featured: event.target.value === "yes" })}>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <button className="button-dark" type="submit">Guardar álbum</button>
      </form>

      <form className="card request-grid section" onSubmit={handleCreateMedia}>
        <h3 className="request-full">Subir media (URL)</h3>
        <label>
          Álbum
          <select value={mediaForm.albumId} onChange={(event) => setMediaForm({ ...mediaForm, albumId: event.target.value })} required>
            <option value="">Selecciona</option>
            {bundles.map(({ album }) => (
              <option key={album.id} value={album.id}>{album.title}</option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select value={mediaForm.type} onChange={(event) => setMediaForm({ ...mediaForm, type: event.target.value })}>
            <option value="photo">photo</option>
            <option value="video">video</option>
          </select>
        </label>
        <label className="request-full">
          URL
          <input value={mediaForm.url} onChange={(event) => setMediaForm({ ...mediaForm, url: event.target.value })} required />
        </label>
        <label>
          Caption
          <input value={mediaForm.caption} onChange={(event) => setMediaForm({ ...mediaForm, caption: event.target.value })} required />
        </label>
        <label>
          Orden
          <input type="number" value={mediaForm.sortOrder} onChange={(event) => setMediaForm({ ...mediaForm, sortOrder: event.target.value })} />
        </label>
        <button className="button-dark" type="submit">Guardar media</button>
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid">
        {bundles.map(({ album, media }) => (
          <article key={album.id} className="card">
            <h3>{album.title}</h3>
            <p className="muted">{album.tripSlug}</p>
            <p>{media.length} assets ({media.filter((item) => item.type === "video").length} videos)</p>
          </article>
        ))}
      </section>
    </>
  );
}
