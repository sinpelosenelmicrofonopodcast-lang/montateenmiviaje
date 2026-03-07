"use client";

import { useState } from "react";
import { GalleryAlbumBundle } from "@/lib/catalog-service";

interface AdminGalleryManagerProps {
  initialBundles: GalleryAlbumBundle[];
}

export function AdminGalleryManager({ initialBundles }: AdminGalleryManagerProps) {
  const [bundles, setBundles] = useState(initialBundles);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
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

  function resetAlbumForm() {
    setAlbumForm({ tripSlug: "", title: "", coverImage: "", featured: true });
    setEditingAlbumId(null);
  }

  function resetMediaForm() {
    setMediaForm({ albumId: "", type: "photo", url: "", caption: "", sortOrder: "0" });
    setEditingMediaId(null);
  }

  function startEditAlbum(bundle: GalleryAlbumBundle) {
    setEditingAlbumId(bundle.album.id);
    setError(null);
    setMessage(null);
    setAlbumForm({
      tripSlug: bundle.album.tripSlug,
      title: bundle.album.title,
      coverImage: bundle.album.coverImage,
      featured: bundle.album.featured
    });
  }

  function startEditMedia(media: GalleryAlbumBundle["media"][number]) {
    setEditingMediaId(media.id);
    setError(null);
    setMessage(null);
    setMediaForm({
      albumId: media.albumId,
      type: media.type,
      url: media.url,
      caption: media.caption,
      sortOrder: String(media.sortOrder ?? 0)
    });
  }

  async function reload() {
    const response = await fetch("/api/admin/gallery/albums", { cache: "no-store" });
    const payload = (await response.json()) as { bundles?: GalleryAlbumBundle[]; message?: string };
    if (!response.ok || !payload.bundles) {
      throw new Error(payload.message ?? "No se pudo cargar galería");
    }
    setBundles(payload.bundles);
  }

  async function handleSaveAlbum(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(editingAlbumId ? `/api/admin/gallery/albums/${editingAlbumId}` : "/api/admin/gallery/albums", {
        method: editingAlbumId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(albumForm)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? `No se pudo ${editingAlbumId ? "actualizar" : "crear"} álbum`);
      }
      await reload();
      setMessage(editingAlbumId ? "Álbum actualizado." : "Álbum creado.");
      resetAlbumForm();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function handleSaveMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(editingMediaId ? `/api/admin/gallery/media/${editingMediaId}` : "/api/admin/gallery/media", {
        method: editingMediaId ? "PATCH" : "POST",
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
        throw new Error(payload.message ?? `No se pudo ${editingMediaId ? "actualizar" : "crear"} media`);
      }
      await reload();
      setMessage(editingMediaId ? "Media actualizada." : "Media creada.");
      resetMediaForm();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function removeAlbum(albumId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/gallery/albums/${albumId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar álbum");
      return;
    }
    if (editingAlbumId === albumId) {
      resetAlbumForm();
    }
    await reload();
    setMessage("Álbum eliminado.");
  }

  async function removeMedia(mediaId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/gallery/media/${mediaId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar media");
      return;
    }
    if (editingMediaId === mediaId) {
      resetMediaForm();
    }
    await reload();
    setMessage("Media eliminada.");
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleSaveAlbum}>
        <h3 className="request-full">{editingAlbumId ? "Editar álbum" : "Crear álbum"}</h3>
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
        <div className="button-row request-full">
          <button className="button-dark" type="submit">{editingAlbumId ? "Actualizar álbum" : "Guardar álbum"}</button>
          {editingAlbumId ? (
            <button className="button-outline" type="button" onClick={resetAlbumForm}>Cancelar edición</button>
          ) : null}
        </div>
      </form>

      <form className="card request-grid section" onSubmit={handleSaveMedia}>
        <h3 className="request-full">{editingMediaId ? "Editar media" : "Subir media (URL)"}</h3>
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
        <div className="button-row request-full">
          <button className="button-dark" type="submit">{editingMediaId ? "Actualizar media" : "Guardar media"}</button>
          {editingMediaId ? (
            <button className="button-outline" type="button" onClick={resetMediaForm}>Cancelar edición</button>
          ) : null}
        </div>
        {message ? <p className="success request-full">{message}</p> : null}
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid">
        {bundles.map((bundle) => (
          <article key={bundle.album.id} className="card">
            <h3>{bundle.album.title}</h3>
            <p className="muted">{bundle.album.tripSlug}</p>
            <p>{bundle.media.length} assets ({bundle.media.filter((item) => item.type === "video").length} videos)</p>
            <div className="button-row">
              <button className="button-dark" type="button" onClick={() => startEditAlbum(bundle)}>
                Editar álbum
              </button>
              <button className="button-outline" type="button" onClick={() => void removeAlbum(bundle.album.id)}>
                Eliminar álbum
              </button>
            </div>
            {bundle.media.length > 0 ? (
              <div className="stack-grid" style={{ marginTop: "12px" }}>
                {bundle.media.map((item) => (
                  <article key={item.id} className="card">
                    <p>{item.type.toUpperCase()} · {item.caption}</p>
                    <p className="muted">{item.url}</p>
                    <div className="button-row">
                      <button className="button-dark" type="button" onClick={() => startEditMedia(item)}>
                        Editar media
                      </button>
                      <button className="button-outline" type="button" onClick={() => void removeMedia(item.id)}>
                        Eliminar media
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </>
  );
}
