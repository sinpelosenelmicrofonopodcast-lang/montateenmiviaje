"use client";

import { useState } from "react";
import { Trip, TripCategory } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface AdminTripBuilderManagerProps {
  initialTrip: Trip;
}

function toTextBlock(values: string[]) {
  return values.join("\n");
}

function toList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminTripBuilderManager({ initialTrip }: AdminTripBuilderManagerProps) {
  const [trip, setTrip] = useState(initialTrip);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [tripForm, setTripForm] = useState({
    slug: trip.slug,
    title: trip.title,
    destination: trip.destination,
    category: trip.category,
    startDate: trip.startDate,
    endDate: trip.endDate,
    availableSpots: String(trip.availableSpots),
    totalSpots: String(trip.totalSpots),
    heroImage: trip.heroImage,
    summary: trip.summary,
    includes: toTextBlock(trip.includes),
    excludes: toTextBlock(trip.excludes),
    policies: toTextBlock(trip.policies),
    requirements: toTextBlock(trip.requirements),
    hotels: toTextBlock(trip.hotels ?? []),
    publishStatus: trip.publishStatus ?? "draft",
    featured: Boolean(trip.featured)
  });

  const [packageForm, setPackageForm] = useState({
    roomType: "doble",
    pricePerPerson: "",
    deposit: "",
    paymentPlan: ""
  });
  const [dayForm, setDayForm] = useState({
    dayNumber: "",
    title: "",
    description: "",
    mapPin: ""
  });
  const [addonForm, setAddonForm] = useState({
    name: "",
    price: ""
  });

  async function refreshTrip() {
    const response = await fetch(`/viajes/${trip.slug}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }
  }

  async function handleUpdateTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tripForm.slug,
          title: tripForm.title,
          destination: tripForm.destination,
          category: tripForm.category,
          startDate: tripForm.startDate,
          endDate: tripForm.endDate,
          availableSpots: Number(tripForm.availableSpots),
          totalSpots: Number(tripForm.totalSpots),
          heroImage: tripForm.heroImage,
          summary: tripForm.summary,
          includes: toList(tripForm.includes),
          excludes: toList(tripForm.excludes),
          policies: toList(tripForm.policies),
          requirements: toList(tripForm.requirements),
          hotels: toList(tripForm.hotels),
          publishStatus: tripForm.publishStatus,
          featured: tripForm.featured
        })
      });

      const payload = (await response.json()) as { message?: string; trip?: Trip };
      if (!response.ok || !payload.trip) {
        throw new Error(payload.message ?? "No se pudo actualizar viaje");
      }

      setTrip(payload.trip);
      await refreshTrip();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: packageForm.roomType,
          pricePerPerson: Number(packageForm.pricePerPerson),
          deposit: Number(packageForm.deposit),
          paymentPlan: packageForm.paymentPlan
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar paquete");
      }
      location.reload();
    } catch (packageError) {
      setError(packageError instanceof Error ? packageError.message : "Error inesperado");
    }
  }

  async function handleAddDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}/days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber: Number(dayForm.dayNumber),
          title: dayForm.title,
          description: dayForm.description,
          mapPin: dayForm.mapPin || undefined
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar día");
      }
      location.reload();
    } catch (dayError) {
      setError(dayError instanceof Error ? dayError.message : "Error inesperado");
    }
  }

  async function handleAddAddon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addonForm.name,
          price: Number(addonForm.price)
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar add-on");
      }
      location.reload();
    } catch (addonError) {
      setError(addonError instanceof Error ? addonError.message : "Error inesperado");
    }
  }

  return (
    <section className="stack-grid">
      <form className="card request-grid" onSubmit={handleUpdateTrip}>
        <h3 className="request-full">Configuración base del viaje</h3>
        <label>
          Slug
          <input value={tripForm.slug} onChange={(event) => setTripForm({ ...tripForm, slug: event.target.value })} required />
        </label>
        <label>
          Título
          <input value={tripForm.title} onChange={(event) => setTripForm({ ...tripForm, title: event.target.value })} required />
        </label>
        <label>
          Destino
          <input
            value={tripForm.destination}
            onChange={(event) => setTripForm({ ...tripForm, destination: event.target.value })}
            required
          />
        </label>
        <label>
          Categoría
          <select
            value={tripForm.category}
            onChange={(event) => setTripForm({ ...tripForm, category: event.target.value as TripCategory })}
          >
            <option value="Luxury">Luxury</option>
            <option value="Adventure">Adventure</option>
            <option value="Family">Family</option>
            <option value="Romantic">Romantic</option>
            <option value="Budget">Budget</option>
          </select>
        </label>
        <label>
          Inicio
          <input
            type="date"
            value={tripForm.startDate}
            onChange={(event) => setTripForm({ ...tripForm, startDate: event.target.value })}
            required
          />
        </label>
        <label>
          Fin
          <input
            type="date"
            value={tripForm.endDate}
            onChange={(event) => setTripForm({ ...tripForm, endDate: event.target.value })}
            required
          />
        </label>
        <label>
          Cupos disponibles
          <input
            type="number"
            value={tripForm.availableSpots}
            onChange={(event) => setTripForm({ ...tripForm, availableSpots: event.target.value })}
            required
          />
        </label>
        <label>
          Cupos totales
          <input
            type="number"
            value={tripForm.totalSpots}
            onChange={(event) => setTripForm({ ...tripForm, totalSpots: event.target.value })}
            required
          />
        </label>
        <label className="request-full">
          Hero image URL
          <input
            value={tripForm.heroImage}
            onChange={(event) => setTripForm({ ...tripForm, heroImage: event.target.value })}
            required
          />
        </label>
        <label className="request-full">
          Resumen
          <textarea
            rows={3}
            value={tripForm.summary}
            onChange={(event) => setTripForm({ ...tripForm, summary: event.target.value })}
            required
          />
        </label>
        <label>
          Estado
          <select
            value={tripForm.publishStatus}
            onChange={(event) =>
              setTripForm({
                ...tripForm,
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
            value={tripForm.featured ? "yes" : "no"}
            onChange={(event) => setTripForm({ ...tripForm, featured: event.target.value === "yes" })}
          >
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>
        <label className="request-full">
          Incluye (líneas)
          <textarea rows={4} value={tripForm.includes} onChange={(event) => setTripForm({ ...tripForm, includes: event.target.value })} />
        </label>
        <label className="request-full">
          No incluye (líneas)
          <textarea rows={4} value={tripForm.excludes} onChange={(event) => setTripForm({ ...tripForm, excludes: event.target.value })} />
        </label>
        <label className="request-full">
          Políticas (líneas)
          <textarea rows={4} value={tripForm.policies} onChange={(event) => setTripForm({ ...tripForm, policies: event.target.value })} />
        </label>
        <label className="request-full">
          Requisitos (líneas)
          <textarea rows={4} value={tripForm.requirements} onChange={(event) => setTripForm({ ...tripForm, requirements: event.target.value })} />
        </label>
        <label className="request-full">
          Hoteles (líneas)
          <textarea rows={3} value={tripForm.hotels} onChange={(event) => setTripForm({ ...tripForm, hotels: event.target.value })} />
        </label>
        <button className="button-dark" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="card">
        <h3>Paquetes actuales</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Habitación</th>
                <th>Precio</th>
                <th>Depósito</th>
                <th>Plan</th>
              </tr>
            </thead>
            <tbody>
              {trip.packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>{pkg.roomType}</td>
                  <td>{formatMoney(pkg.pricePerPerson)}</td>
                  <td>{formatMoney(pkg.deposit)}</td>
                  <td>{pkg.paymentPlan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="builder-grid" onSubmit={handleAddPackage}>
          <label>
            Habitación
            <select
              value={packageForm.roomType}
              onChange={(event) => setPackageForm({ ...packageForm, roomType: event.target.value })}
            >
              <option value="single">single</option>
              <option value="doble">doble</option>
              <option value="triple">triple</option>
            </select>
          </label>
          <label>
            Precio por persona
            <input
              type="number"
              value={packageForm.pricePerPerson}
              onChange={(event) => setPackageForm({ ...packageForm, pricePerPerson: event.target.value })}
              required
            />
          </label>
          <label>
            Depósito
            <input
              type="number"
              value={packageForm.deposit}
              onChange={(event) => setPackageForm({ ...packageForm, deposit: event.target.value })}
              required
            />
          </label>
          <label className="request-full">
            Plan de pago
            <input
              value={packageForm.paymentPlan}
              onChange={(event) => setPackageForm({ ...packageForm, paymentPlan: event.target.value })}
              required
            />
          </label>
          <button className="button-outline" type="submit">Guardar paquete</button>
        </form>
      </section>

      <section className="card">
        <h3>Itinerario por días</h3>
        {trip.itinerary.map((day) => (
          <article key={day.dayNumber} className="itinerary-item">
            <strong>Día {day.dayNumber}: {day.title}</strong>
            <p>{day.description}</p>
          </article>
        ))}
        <form className="builder-grid" onSubmit={handleAddDay}>
          <label>
            Día #
            <input
              type="number"
              value={dayForm.dayNumber}
              onChange={(event) => setDayForm({ ...dayForm, dayNumber: event.target.value })}
              required
            />
          </label>
          <label>
            Título
            <input value={dayForm.title} onChange={(event) => setDayForm({ ...dayForm, title: event.target.value })} required />
          </label>
          <label>
            Map pin
            <input value={dayForm.mapPin} onChange={(event) => setDayForm({ ...dayForm, mapPin: event.target.value })} />
          </label>
          <label className="request-full">
            Descripción
            <textarea
              rows={3}
              value={dayForm.description}
              onChange={(event) => setDayForm({ ...dayForm, description: event.target.value })}
              required
            />
          </label>
          <button className="button-outline" type="submit">Guardar día</button>
        </form>
      </section>

      <section className="card">
        <h3>Add-ons</h3>
        <ul>
          {trip.addons.map((addon) => (
            <li key={addon.id}>
              {addon.name} · {formatMoney(addon.price)}
            </li>
          ))}
        </ul>
        <form className="builder-grid" onSubmit={handleAddAddon}>
          <label>
            Nombre
            <input value={addonForm.name} onChange={(event) => setAddonForm({ ...addonForm, name: event.target.value })} required />
          </label>
          <label>
            Precio
            <input
              type="number"
              value={addonForm.price}
              onChange={(event) => setAddonForm({ ...addonForm, price: event.target.value })}
              required
            />
          </label>
          <button className="button-outline" type="submit">Agregar add-on</button>
        </form>
      </section>
    </section>
  );
}
