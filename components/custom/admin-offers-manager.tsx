"use client";

import { useState } from "react";
import { Offer } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface AdminOffersManagerProps {
  initialOffers: Offer[];
}

export function AdminOffersManager({ initialOffers }: AdminOffersManagerProps) {
  const [offers, setOffers] = useState(initialOffers);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    discountType: "percent",
    value: "",
    tripSlug: "",
    startsAt: "",
    endsAt: "",
    active: true
  });

  async function reload() {
    const response = await fetch("/api/admin/offers", { cache: "no-store" });
    const payload = (await response.json()) as { offers?: Offer[]; message?: string };
    if (!response.ok || !payload.offers) {
      throw new Error(payload.message ?? "No se pudieron cargar ofertas");
    }
    setOffers(payload.offers);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          code: form.code,
          discountType: form.discountType,
          value: Number(form.value),
          tripSlug: form.tripSlug || undefined,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          active: form.active
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear oferta");
      }
      await reload();
      setForm({
        title: "",
        description: "",
        code: "",
        discountType: "percent",
        value: "",
        tripSlug: "",
        startsAt: "",
        endsAt: "",
        active: true
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function toggleOffer(offer: Offer) {
    setError(null);
    const response = await fetch(`/api/admin/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !offer.active })
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo actualizar oferta");
      return;
    }
    await reload();
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleCreate}>
        <h3 className="request-full">Crear oferta</h3>
        <label>
          Título
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label>
          Código
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        </label>
        <label className="request-full">
          Descripción
          <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <label>
          Tipo
          <select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label>
          Valor
          <input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required />
        </label>
        <label>
          Trip slug (opcional)
          <input value={form.tripSlug} onChange={(event) => setForm({ ...form, tripSlug: event.target.value })} />
        </label>
        <label>
          Inicio
          <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
        </label>
        <label>
          Fin
          <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
        </label>
        <label>
          Activa
          <select value={form.active ? "yes" : "no"} onChange={(event) => setForm({ ...form, active: event.target.value === "yes" })}>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <button className="button-dark" type="submit">Guardar oferta</button>
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {offers.map((offer) => (
          <article key={offer.id} className="card">
            <p className="chip">{offer.discountType === "percent" ? "Percent" : "Fixed"}</p>
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
            <p>Código: <strong>{offer.code}</strong></p>
            <p>
              Valor:{" "}
              <strong>
                {offer.discountType === "percent" ? `${offer.value}%` : formatMoney(offer.value)}
              </strong>
            </p>
            <p>Estado: {offer.active ? "Activa" : "Inactiva"}</p>
            <div className="button-row">
              <button className="button-outline" type="button" onClick={() => void toggleOffer(offer)}>
                {offer.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
