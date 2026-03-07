"use client";

import { useState } from "react";
import type { CreateTravelPackageInput, TravelQuote } from "@/lib/travel/types";

interface PackageBuilderFormProps {
  quotes: TravelQuote[];
  onSubmit: (input: CreateTravelPackageInput) => Promise<void> | void;
  loading?: boolean;
}

export function PackageBuilderForm({ quotes, onSubmit, loading }: PackageBuilderFormProps) {
  const [form, setForm] = useState({
    packageName: "",
    destination: "",
    status: "draft" as "draft" | "internal" | "ready" | "archived",
    visibility: "internal" as "internal" | "private",
    startDate: "",
    endDate: "",
    baseQuoteId: "",
    linkedTripSlug: "",
    tags: "",
    notes: ""
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      packageName: form.packageName.trim(),
      destination: form.destination.trim(),
      status: form.status,
      visibility: form.visibility,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      baseQuoteId: form.baseQuoteId || undefined,
      linkedTripSlug: form.linkedTripSlug.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: form.notes.trim() || undefined
    });
  }

  return (
    <form className="card request-grid" onSubmit={handleSubmit}>
      <h3 className="request-full">Package Builder</h3>
      <label>
        Nombre paquete
        <input
          value={form.packageName}
          onChange={(event) => setForm({ ...form, packageName: event.target.value })}
          required
        />
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
        Estado
        <select
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value as typeof form.status })}
        >
          <option value="draft">draft</option>
          <option value="internal">internal</option>
          <option value="ready">ready</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <label>
        Visibilidad
        <select
          value={form.visibility}
          onChange={(event) => setForm({ ...form, visibility: event.target.value as typeof form.visibility })}
        >
          <option value="internal">internal</option>
          <option value="private">private</option>
        </select>
      </label>
      <label>
        Fecha inicio
        <input
          type="date"
          value={form.startDate}
          onChange={(event) => setForm({ ...form, startDate: event.target.value })}
        />
      </label>
      <label>
        Fecha fin
        <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
      </label>
      <label className="request-full">
        Basado en quote (opcional)
        <select
          value={form.baseQuoteId}
          onChange={(event) => setForm({ ...form, baseQuoteId: event.target.value })}
        >
          <option value="">Ninguna</option>
          {quotes.map((quote) => (
            <option key={quote.id} value={quote.id}>
              {quote.quoteNumber} · {quote.destination}
            </option>
          ))}
        </select>
      </label>
      <label>
        Vincular oferta/viaje (slug)
        <input
          value={form.linkedTripSlug}
          onChange={(event) => setForm({ ...form, linkedTripSlug: event.target.value })}
        />
      </label>
      <label>
        Tags (coma)
        <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
      </label>
      <label className="request-full">
        Notas
        <textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </label>
      <button className="button-dark request-full" type="submit" disabled={Boolean(loading)}>
        {loading ? "Guardando..." : "Guardar paquete"}
      </button>
    </form>
  );
}
