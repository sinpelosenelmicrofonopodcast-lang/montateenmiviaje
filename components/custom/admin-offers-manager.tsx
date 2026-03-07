"use client";

import { useState } from "react";
import { Offer } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface AdminOffersManagerProps {
  initialOffers: Offer[];
}

export function AdminOffersManager({ initialOffers }: AdminOffersManagerProps) {
  const [offers, setOffers] = useState(initialOffers);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    code: "",
    discountType: "percent",
    value: "",
    tripSlug: "",
    startsAt: "",
    endsAt: "",
    active: true,
    publishStatus: "published"
  });

  function toDateTimeLocal(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }

  function resetForm() {
    setForm({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      ctaLabel: "",
      ctaHref: "",
      code: "",
      discountType: "percent",
      value: "",
      tripSlug: "",
      startsAt: "",
      endsAt: "",
      active: true,
      publishStatus: "published"
    });
    setEditingOfferId(null);
  }

  function startEdit(offer: Offer) {
    setEditingOfferId(offer.id);
    setError(null);
    setMessage(null);
    setForm({
      title: offer.title,
      subtitle: offer.subtitle ?? "",
      description: offer.description,
      imageUrl: offer.imageUrl ?? "",
      ctaLabel: offer.ctaLabel ?? "",
      ctaHref: offer.ctaHref ?? "",
      code: offer.code,
      discountType: offer.discountType,
      value: String(offer.value),
      tripSlug: offer.tripSlug ?? "",
      startsAt: toDateTimeLocal(offer.startsAt),
      endsAt: toDateTimeLocal(offer.endsAt),
      active: offer.active,
      publishStatus: offer.publishStatus ?? "published"
    });
  }

  async function reload() {
    const response = await fetch("/api/admin/offers", { cache: "no-store" });
    const payload = (await response.json()) as { offers?: Offer[]; message?: string };
    if (!response.ok || !payload.offers) {
      throw new Error(payload.message ?? "No se pudieron cargar ofertas");
    }
    setOffers(payload.offers);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const body = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        code: form.code,
        discountType: form.discountType,
        value: Number(form.value),
        tripSlug: form.tripSlug || undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
        active: form.active,
        publishStatus: form.publishStatus
      };

      const response = await fetch(editingOfferId ? `/api/admin/offers/${editingOfferId}` : "/api/admin/offers", {
        method: editingOfferId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? `No se pudo ${editingOfferId ? "actualizar" : "crear"} oferta`);
      }
      await reload();
      setMessage(editingOfferId ? "Oferta actualizada." : "Oferta creada.");
      resetForm();
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

  async function deleteOffer(offerId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/offers/${offerId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar oferta");
      return;
    }
    if (editingOfferId === offerId) {
      resetForm();
    }
    await reload();
    setMessage("Oferta eliminada.");
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleSave}>
        <h3 className="request-full">{editingOfferId ? "Editar oferta" : "Crear oferta"}</h3>
        <label>
          Título
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label>
          Código
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        </label>
        <label>
          Subtítulo
          <input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
        </label>
        <label className="request-full">
          Descripción
          <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <label className="request-full">
          Imagen URL
          <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
        </label>
        <label>
          CTA label
          <input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
        </label>
        <label>
          CTA href
          <input value={form.ctaHref} onChange={(event) => setForm({ ...form, ctaHref: event.target.value })} />
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
        <label>
          Publish status
          <select value={form.publishStatus} onChange={(event) => setForm({ ...form, publishStatus: event.target.value })}>
            <option value="published">published</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit">
            {editingOfferId ? "Actualizar oferta" : "Guardar oferta"}
          </button>
          {editingOfferId ? (
            <button className="button-outline" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
        {message ? <p className="success request-full">{message}</p> : null}
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {offers.map((offer) => (
          <article key={offer.id} className="card">
            <p className="chip">{offer.discountType === "percent" ? "Percent" : "Fixed"}</p>
            <h3>{offer.title}</h3>
            {offer.subtitle ? <p className="muted">{offer.subtitle}</p> : null}
            <p>{offer.description}</p>
            <p>Código: <strong>{offer.code}</strong></p>
            <p>
              Valor:{" "}
              <strong>
                {offer.discountType === "percent" ? `${offer.value}%` : formatMoney(offer.value)}
              </strong>
            </p>
            <p>Estado: {offer.active ? "Activa" : "Inactiva"} · {offer.publishStatus ?? "published"}</p>
            <div className="button-row">
              <button className="button-dark" type="button" onClick={() => startEdit(offer)}>
                Editar
              </button>
              <button className="button-outline" type="button" onClick={() => void toggleOffer(offer)}>
                {offer.active ? "Desactivar" : "Activar"}
              </button>
              <button className="button-outline" type="button" onClick={() => void deleteOffer(offer.id)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
