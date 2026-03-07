"use client";

import Link from "next/link";
import { useState } from "react";
import { Trip } from "@/lib/types";
import { formatDateRange, formatMoney, getStartingPrice } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";

interface AdminTripsManagerProps {
  initialTrips: Trip[];
}

function toList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminTripsManager({ initialTrips }: AdminTripsManagerProps) {
  const [trips, setTrips] = useState(initialTrips);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    destination: "",
    category: "Luxury",
    startDate: "",
    endDate: "",
    availableSpots: "20",
    totalSpots: "20",
    heroImage: "",
    summary: "",
    priceFrom: "",
    shortDescription: "",
    longDescription: "",
    durationDays: "",
    galleryImages: "",
    includes: "",
    excludes: "",
    policies: "",
    requirements: "",
    hotels: "",
    publishStatus: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoOgImage: ""
  });

  function resetForm() {
    setForm({
      slug: "",
      title: "",
      destination: "",
      category: "Luxury",
      startDate: "",
      endDate: "",
      availableSpots: "20",
      totalSpots: "20",
      heroImage: "",
      summary: "",
      priceFrom: "",
      shortDescription: "",
      longDescription: "",
      durationDays: "",
      galleryImages: "",
      includes: "",
      excludes: "",
      policies: "",
      requirements: "",
      hotels: "",
      publishStatus: "draft",
      featured: false,
      seoTitle: "",
      seoDescription: "",
      seoOgImage: ""
    });
    setEditingTripId(null);
  }

  function startEdit(trip: Trip) {
    setEditingTripId(trip.id);
    setError(null);
    setMessage(null);
    setForm({
      slug: trip.slug,
      title: trip.title,
      destination: trip.destination,
      category: trip.category,
      startDate: trip.startDate.slice(0, 10),
      endDate: trip.endDate.slice(0, 10),
      availableSpots: String(trip.availableSpots),
      totalSpots: String(trip.totalSpots),
      heroImage: trip.heroImage,
      summary: trip.summary,
      priceFrom: trip.priceFrom ? String(trip.priceFrom) : "",
      shortDescription: trip.shortDescription ?? "",
      longDescription: trip.longDescription ?? "",
      durationDays: trip.durationDays ? String(trip.durationDays) : "",
      galleryImages: (trip.galleryImages ?? []).join("\n"),
      includes: trip.includes.join("\n"),
      excludes: trip.excludes.join("\n"),
      policies: trip.policies.join("\n"),
      requirements: trip.requirements.join("\n"),
      hotels: (trip.hotels ?? []).join("\n"),
      publishStatus: trip.publishStatus ?? "draft",
      featured: Boolean(trip.featured),
      seoTitle: trip.seoTitle ?? "",
      seoDescription: trip.seoDescription ?? "",
      seoOgImage: trip.seoOgImage ?? ""
    });
  }

  async function reloadTrips() {
    const response = await fetch("/api/admin/trips", { cache: "no-store" });
    const payload = (await response.json()) as { trips?: Trip[]; message?: string };
    if (!response.ok || !payload.trips) {
      throw new Error(payload.message ?? "No se pudieron cargar viajes");
    }
    setTrips(payload.trips);
  }

  async function handleHeroImageUpload(file: File) {
    setUploadingImage(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("slug", form.slug || "trip");

      const response = await fetch("/api/admin/uploads/trip-image", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "No se pudo subir imagen");
      }

      setForm((current) => ({ ...current, heroImage: payload.url! }));
      setMessage("Imagen subida y asignada al viaje.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Error inesperado");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const body = {
        slug: form.slug,
        title: form.title,
        destination: form.destination,
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate,
        availableSpots: Number(form.availableSpots),
        totalSpots: Number(form.totalSpots),
        heroImage: form.heroImage,
        summary: form.summary,
        priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
        shortDescription: form.shortDescription || undefined,
        longDescription: form.longDescription || undefined,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        galleryImages: toList(form.galleryImages),
        includes: toList(form.includes),
        excludes: toList(form.excludes),
        policies: toList(form.policies),
        requirements: toList(form.requirements),
        hotels: toList(form.hotels),
        publishStatus: form.publishStatus,
        featured: form.featured,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoOgImage: form.seoOgImage || undefined
      };

      const response = await fetch(editingTripId ? `/api/admin/trips/${editingTripId}` : "/api/admin/trips", {
        method: editingTripId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? `No se pudo ${editingTripId ? "actualizar" : "crear"} viaje`);
      }

      await reloadTrips();
      setMessage(editingTripId ? "Viaje actualizado." : "Viaje creado.");
      resetForm();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTrip(tripId: string) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo eliminar viaje");
      }

      await reloadTrips();
      if (editingTripId === tripId) {
        resetForm();
      }
      setMessage("Viaje eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleSaveTrip}>
        <h3 className="request-full">{editingTripId ? "Editar viaje" : "Crear viaje real"}</h3>
        <label>
          Slug
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
        </label>
        <label>
          Título
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label>
          Destino
          <input
            value={form.destination}
            onChange={(event) => setForm({ ...form, destination: event.target.value })}
            required
          />
        </label>
        <label>
          Categoría
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option value="Luxury">Luxury</option>
            <option value="Adventure">Adventure</option>
            <option value="Family">Family</option>
            <option value="Romantic">Romantic</option>
            <option value="Budget">Budget</option>
          </select>
        </label>
        <label>
          Fecha inicio
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            required
          />
        </label>
        <label>
          Fecha fin
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            required
          />
        </label>
        <label>
          Cupos disponibles
          <input
            type="number"
            value={form.availableSpots}
            onChange={(event) => setForm({ ...form, availableSpots: event.target.value })}
            required
          />
        </label>
        <label>
          Cupos totales
          <input
            type="number"
            value={form.totalSpots}
            onChange={(event) => setForm({ ...form, totalSpots: event.target.value })}
            required
          />
        </label>
        <label className="request-full">
          Hero image URL
          <input
            value={form.heroImage}
            onChange={(event) => setForm({ ...form, heroImage: event.target.value })}
            required
          />
        </label>
        <label className="request-full">
          Subir imagen (si no tienes URL)
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                void handleHeroImageUpload(file);
              }
              event.currentTarget.value = "";
            }}
            disabled={uploadingImage}
          />
        </label>
        {uploadingImage ? <p className="muted request-full">Subiendo imagen...</p> : null}
        {form.heroImage ? (
          <div className="request-full">
            <p className="muted">Preview imagen</p>
            <img src={toPublicImageSrc(form.heroImage)} alt="Preview viaje" className="trip-card-image" />
          </div>
        ) : null}
        <label className="request-full">
          Resumen
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            required
          />
        </label>
        <label>
          Precio desde (USD)
          <input
            type="number"
            min={1}
            value={form.priceFrom}
            onChange={(event) => setForm({ ...form, priceFrom: event.target.value })}
            placeholder="Ej: 1890"
          />
        </label>
        <label className="request-full">
          Descripción corta
          <textarea rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} />
        </label>
        <label className="request-full">
          Descripción larga
          <textarea rows={4} value={form.longDescription} onChange={(event) => setForm({ ...form, longDescription: event.target.value })} />
        </label>
        <label>
          Duración (días)
          <input type="number" min={1} value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: event.target.value })} />
        </label>
        <label>
          Estado
          <select
            value={form.publishStatus}
            onChange={(event) =>
              setForm({
                ...form,
                publishStatus: event.target.value as "draft" | "published" | "unpublished" | "sold_out" | "archived"
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Publicado</option>
            <option value="unpublished">Despublicado</option>
            <option value="sold_out">Sold out</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
        <label>
          Destacado
          <select
            value={form.featured ? "yes" : "no"}
            onChange={(event) => setForm({ ...form, featured: event.target.value === "yes" })}
          >
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>
        <label className="request-full">
          Galería (1 URL por línea)
          <textarea rows={4} value={form.galleryImages} onChange={(event) => setForm({ ...form, galleryImages: event.target.value })} />
        </label>
        <label className="request-full">
          Incluye (1 línea por item)
          <textarea rows={4} value={form.includes} onChange={(event) => setForm({ ...form, includes: event.target.value })} />
        </label>
        <label className="request-full">
          No incluye (1 línea por item)
          <textarea rows={4} value={form.excludes} onChange={(event) => setForm({ ...form, excludes: event.target.value })} />
        </label>
        <label className="request-full">
          Políticas (1 línea por item)
          <textarea rows={4} value={form.policies} onChange={(event) => setForm({ ...form, policies: event.target.value })} />
        </label>
        <label className="request-full">
          Requisitos (1 línea por item)
          <textarea
            rows={4}
            value={form.requirements}
            onChange={(event) => setForm({ ...form, requirements: event.target.value })}
          />
        </label>
        <label className="request-full">
          Hoteles (1 línea por item)
          <textarea rows={3} value={form.hotels} onChange={(event) => setForm({ ...form, hotels: event.target.value })} />
        </label>
        <label>
          SEO title
          <input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
        </label>
        <label className="request-full">
          SEO description
          <textarea rows={3} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
        </label>
        <label className="request-full">
          SEO og image
          <input value={form.seoOgImage} onChange={(event) => setForm({ ...form, seoOgImage: event.target.value })} />
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading}>
            {loading ? "Guardando..." : editingTripId ? "Actualizar viaje" : "Guardar viaje"}
          </button>
          {editingTripId ? (
            <button className="button-outline" type="button" disabled={loading} onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
        {message ? <p className="success request-full">{message}</p> : null}
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {trips.map((trip) => {
          const minPrice = getStartingPrice(trip.packages, trip.priceFrom);

          return (
            <article key={trip.id} className="card">
              <div className="table-head-row">
                <div>
                  <p className="chip">{trip.category}</p>
                  <h3>{trip.title}</h3>
                  <p className="muted">{trip.destination}</p>
                </div>
                <div className="right-info">
                  <p>{formatDateRange(trip.startDate, trip.endDate)}</p>
                  <p>Cupos: {trip.availableSpots}/{trip.totalSpots}</p>
                  <p>Desde {minPrice ? formatMoney(minPrice) : "Sin precio configurado"}</p>
                  <p>Estado: {trip.publishStatus ?? "draft"}</p>
                </div>
              </div>
              <div className="button-row">
                <button className="button-dark" type="button" onClick={() => startEdit(trip)}>
                  Editar
                </button>
                <Link className="button-dark" href={`/admin/viajes/${trip.slug}/builder`}>
                  Abrir builder
                </Link>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}>
                  PDF cliente
                </a>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=internal&lang=es&showPrices=true`}>
                  PDF interno
                </a>
                <button className="button-outline" type="button" onClick={() => void handleDeleteTrip(trip.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
