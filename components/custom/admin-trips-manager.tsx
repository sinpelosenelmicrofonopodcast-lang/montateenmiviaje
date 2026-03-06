"use client";

import Link from "next/link";
import { useState } from "react";
import { Trip } from "@/lib/types";
import { formatDateRange, formatMoney } from "@/lib/format";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    includes: "",
    excludes: "",
    policies: "",
    requirements: "",
    hotels: "",
    publishStatus: "draft",
    featured: false
  });

  async function reloadTrips() {
    const response = await fetch("/api/admin/trips", { cache: "no-store" });
    const payload = (await response.json()) as { trips?: Trip[]; message?: string };
    if (!response.ok || !payload.trips) {
      throw new Error(payload.message ?? "No se pudieron cargar viajes");
    }
    setTrips(payload.trips);
  }

  async function handleCreateTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          includes: toList(form.includes),
          excludes: toList(form.excludes),
          policies: toList(form.policies),
          requirements: toList(form.requirements),
          hotels: toList(form.hotels),
          publishStatus: form.publishStatus,
          featured: form.featured
        })
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear viaje");
      }

      await reloadTrips();
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
        includes: "",
        excludes: "",
        policies: "",
        requirements: "",
        hotels: "",
        publishStatus: "draft",
        featured: false
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleCreateTrip}>
        <h3 className="request-full">Crear viaje real</h3>
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
          Resumen
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            required
          />
        </label>
        <label>
          Estado
          <select
            value={form.publishStatus}
            onChange={(event) =>
              setForm({
                ...form,
                publishStatus: event.target.value as "draft" | "published" | "unpublished"
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Publicado</option>
            <option value="unpublished">Despublicado</option>
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
        <button className="button-dark" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar viaje"}
        </button>
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {trips.map((trip) => {
          const minPrice =
            trip.packages.length > 0
              ? Math.min(...trip.packages.map((pkg) => pkg.pricePerPerson))
              : 0;

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
                  <p>Desde {minPrice ? formatMoney(minPrice) : "Sin paquetes"}</p>
                  <p>Estado: {trip.publishStatus ?? "draft"}</p>
                </div>
              </div>
              <div className="button-row">
                <Link className="button-dark" href={`/admin/viajes/${trip.slug}/builder`}>
                  Abrir builder
                </Link>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}>
                  PDF cliente
                </a>
                <a className="button-outline" href={`/api/pdf/trip/${trip.slug}?audience=internal&lang=es&showPrices=true`}>
                  PDF interno
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
