"use client";

import { useState } from "react";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 8);

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

export function CustomRequestForm() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(toDateInput(tomorrow));
  const [endDate, setEndDate] = useState(toDateInput(nextWeek));
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(5000);
  const [motive, setMotive] = useState("");
  const [expectations, setExpectations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requestId: string; packagePageUrl: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          destination,
          startDate,
          endDate,
          travelers,
          budget,
          motive,
          expectations
        })
      });

      const payload = (await response.json()) as {
        requestId?: string;
        packagePageUrl?: string;
        message?: string;
      };

      if (!response.ok || !payload.requestId || !payload.packagePageUrl) {
        throw new Error(payload.message ?? "No se pudo enviar la solicitud");
      }

      setResult({ requestId: payload.requestId, packagePageUrl: payload.packagePageUrl });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error inesperado";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <form onSubmit={handleSubmit} className="request-grid">
        <label>
          Nombre completo
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Destino deseado
          <input value={destination} onChange={(event) => setDestination(event.target.value)} required />
        </label>
        <label>
          Fecha inicio
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </label>
        <label>
          Fecha fin
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
        </label>
        <label>
          Personas
          <input
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(event) => setTravelers(Number(event.target.value) || 1)}
            required
          />
        </label>
        <label>
          Presupuesto total (USD)
          <input
            type="number"
            min={500}
            step={100}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value) || 0)}
            required
          />
        </label>
        <label>
          Motivo del viaje
          <input value={motive} onChange={(event) => setMotive(event.target.value)} required />
        </label>
        <label className="request-full">
          Expectativas
          <textarea
            rows={5}
            value={expectations}
            onChange={(event) => setExpectations(event.target.value)}
            required
          />
        </label>
        <button className="button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud personalizada"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <div className="card" style={{ marginTop: "16px" }}>
          <p className="success">Solicitud enviada. ID: {result.requestId}</p>
          <p>
            Te notificaremos por correo cuando el paquete esté listo. También puedes revisarlo aquí:
            <a className="button-outline" href={result.packagePageUrl} style={{ marginLeft: "12px" }}>
              Ver estado de propuesta
            </a>
          </p>
        </div>
      ) : null}
    </section>
  );
}
