"use client";

import { useState } from "react";
import { Testimonial } from "@/lib/types";

interface AdminTestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function AdminTestimonialsManager({ initialTestimonials }: AdminTestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [form, setForm] = useState({
    customerName: "",
    tripTitle: "",
    quote: "",
    rating: "5",
    verified: true,
    approved: true
  });
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
    const payload = (await response.json()) as { testimonials?: Testimonial[]; message?: string };
    if (!response.ok || !payload.testimonials) {
      throw new Error(payload.message ?? "No se pudieron cargar testimonios");
    }
    setTestimonials(payload.testimonials);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          tripTitle: form.tripTitle,
          quote: form.quote,
          rating: Number(form.rating),
          verified: form.verified,
          approved: form.approved
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear testimonio");
      }
      await reload();
      setForm({
        customerName: "",
        tripTitle: "",
        quote: "",
        rating: "5",
        verified: true,
        approved: true
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    }
  }

  async function patchStatus(id: string, changes: { verified?: boolean; approved?: boolean }) {
    setError(null);
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
  }

  return (
    <>
      <form className="card request-grid" onSubmit={handleCreate}>
        <h3 className="request-full">Crear testimonio</h3>
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
        <button className="button-dark" type="submit">Guardar testimonio</button>
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid section">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "No verificado"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
            <div className="button-row">
              <button className="button-dark" type="button" onClick={() => void patchStatus(testimonial.id, { approved: true, verified: true })}>
                Aprobar
              </button>
              <button className="button-outline" type="button" onClick={() => void patchStatus(testimonial.id, { approved: false })}>
                Ocultar
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
