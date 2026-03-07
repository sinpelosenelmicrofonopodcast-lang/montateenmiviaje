"use client";

import { useState } from "react";
import { Testimonial } from "@/lib/types";

interface AdminTestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function AdminTestimonialsManager({ initialTestimonials }: AdminTestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    tripTitle: "",
    quote: "",
    rating: "5",
    city: "",
    photoUrl: "",
    videoUrl: "",
    featured: false,
    publishStatus: "published",
    verified: true,
    approved: true
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setForm({
      customerName: "",
      tripTitle: "",
      quote: "",
      rating: "5",
      city: "",
      photoUrl: "",
      videoUrl: "",
      featured: false,
      publishStatus: "published",
      verified: true,
      approved: true
    });
    setEditingId(null);
  }

  function startEdit(testimonial: Testimonial) {
    setEditingId(testimonial.id);
    setError(null);
    setMessage(null);
    setForm({
      customerName: testimonial.customerName,
      tripTitle: testimonial.tripTitle,
      quote: testimonial.quote,
      rating: String(testimonial.rating),
      city: testimonial.city ?? "",
      photoUrl: testimonial.photoUrl ?? "",
      videoUrl: testimonial.videoUrl ?? "",
      featured: Boolean(testimonial.featured),
      publishStatus: testimonial.publishStatus ?? "published",
      verified: testimonial.verified,
      approved: testimonial.approved ?? true
    });
  }

  async function reload() {
    const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
    const payload = (await response.json()) as { testimonials?: Testimonial[]; message?: string };
    if (!response.ok || !payload.testimonials) {
      throw new Error(payload.message ?? "No se pudieron cargar testimonios");
    }
    setTestimonials(payload.testimonials);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const body = {
        customerName: form.customerName,
        tripTitle: form.tripTitle,
        quote: form.quote,
        rating: Number(form.rating),
        city: form.city || undefined,
        photoUrl: form.photoUrl || undefined,
        videoUrl: form.videoUrl || undefined,
        featured: form.featured,
        publishStatus: form.publishStatus,
        verified: form.verified,
        approved: form.approved
      };

      const response = await fetch(editingId ? `/api/admin/testimonials/${editingId}` : "/api/admin/testimonials", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? `No se pudo ${editingId ? "actualizar" : "crear"} testimonio`);
      }
      await reload();
      setMessage(editingId ? "Testimonio actualizado." : "Testimonio creado.");
      resetForm();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function patchStatus(id: string, changes: { verified?: boolean; approved?: boolean }) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes)
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo actualizar testimonio");
      return;
    }
    await reload();
    setMessage("Estado de testimonio actualizado.");
  }

  async function removeTestimonial(id: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar testimonio");
      return;
    }
    if (editingId === id) {
      resetForm();
    }
    await reload();
    setMessage("Testimonio eliminado.");
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleSave}>
        <h3 className="request-full">{editingId ? "Editar testimonio" : "Crear testimonio"}</h3>
        <label>
          Cliente
          <input
            value={form.customerName}
            onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            required
          />
        </label>
        <label>
          Viaje
          <input value={form.tripTitle} onChange={(event) => setForm({ ...form, tripTitle: event.target.value })} required />
        </label>
        <label className="request-full">
          Quote
          <textarea rows={3} value={form.quote} onChange={(event) => setForm({ ...form, quote: event.target.value })} required />
        </label>
        <label>
          Rating
          <input type="number" min={1} max={5} value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} />
        </label>
        <label>
          Ciudad
          <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        </label>
        <label className="request-full">
          Foto URL
          <input value={form.photoUrl} onChange={(event) => setForm({ ...form, photoUrl: event.target.value })} />
        </label>
        <label className="request-full">
          Video URL
          <input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} />
        </label>
        <label>
          Featured
          <select value={form.featured ? "yes" : "no"} onChange={(event) => setForm({ ...form, featured: event.target.value === "yes" })}>
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
        <label>
          Verificado
          <select value={form.verified ? "yes" : "no"} onChange={(event) => setForm({ ...form, verified: event.target.value === "yes" })}>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          Aprobado
          <select value={form.approved ? "yes" : "no"} onChange={(event) => setForm({ ...form, approved: event.target.value === "yes" })}>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit">
            {editingId ? "Actualizar testimonio" : "Guardar testimonio"}
          </button>
          {editingId ? (
            <button className="button-outline" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
        {message ? <p className="success request-full">{message}</p> : null}
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "No verificado"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
            {testimonial.city ? <p className="muted">{testimonial.city}</p> : null}
            <div className="button-row">
              <button className="button-dark" type="button" onClick={() => startEdit(testimonial)}>
                Editar
              </button>
              <button className="button-dark" type="button" onClick={() => void patchStatus(testimonial.id, { approved: true, verified: true })}>
                Aprobar
              </button>
              <button className="button-outline" type="button" onClick={() => void patchStatus(testimonial.id, { approved: false })}>
                Ocultar
              </button>
              <button className="button-outline" type="button" onClick={() => void removeTestimonial(testimonial.id)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
