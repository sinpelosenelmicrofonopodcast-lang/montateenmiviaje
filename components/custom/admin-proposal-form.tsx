"use client";

import { useMemo, useState } from "react";

interface AdminProposalFormProps {
  requestId: string;
  customerName: string;
  destination: string;
  travelers: number;
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminProposalForm({ requestId, customerName, destination, travelers }: AdminProposalFormProps) {
  const [title, setTitle] = useState(`${destination} Custom Experience`);
  const [summary, setSummary] = useState(`Propuesta premium personalizada para ${customerName}.`);
  const [itinerary, setItinerary] = useState("Día 1: Llegada y recepción premium\nDía 2: Experiencia principal\nDía 3: Día libre curado");
  const [includes, setIncludes] = useState("Hotel premium\nTransfers\nAsistencia concierge");
  const [excludes, setExcludes] = useState("Vuelos\nSeguro\nGastos personales");
  const [pricePerPerson, setPricePerPerson] = useState(2200);
  const [deposit, setDeposit] = useState(600);
  const [paymentPlan, setPaymentPlan] = useState("Depósito + 2 cuotas mensuales");
  const [notes, setNotes] = useState("Podemos ajustar hoteles y ritmo según preferencias.");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pageUrl = useMemo(() => `/propuesta/${requestId}`, [requestId]);
  const pdfUrl = useMemo(() => `/api/pdf/custom-proposal/${requestId}`, [requestId]);

  async function handleCreateProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/custom-requests/${requestId}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          itinerary: parseLines(itinerary),
          includes: parseLines(includes),
          excludes: parseLines(excludes),
          pricePerPerson,
          deposit,
          paymentPlan,
          notes,
          pageUrl,
          pdfUrl
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        emailProvider?: string;
        revision?: number;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo crear la propuesta");
      }

      setSuccess(`Paquete enviado al cliente. Revisión #${payload.revision} · correo: ${payload.emailProvider}`);
    } catch (proposalError) {
      const message = proposalError instanceof Error ? proposalError.message : "Error inesperado";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleCreateProposal} className="request-grid card">
      <h3>Crear paquete para {customerName}</h3>
      <p className="muted">Grupo de {travelers} personas</p>

      <label>
        Título propuesta
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="request-full">
        Resumen
        <textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} required />
      </label>
      <label className="request-full">
        Itinerario (1 línea por día)
        <textarea rows={5} value={itinerary} onChange={(event) => setItinerary(event.target.value)} required />
      </label>
      <label>
        Incluye (1 línea por item)
        <textarea rows={4} value={includes} onChange={(event) => setIncludes(event.target.value)} required />
      </label>
      <label>
        No incluye (1 línea por item)
        <textarea rows={4} value={excludes} onChange={(event) => setExcludes(event.target.value)} required />
      </label>
      <label>
        Precio por persona (USD)
        <input
          type="number"
          min={100}
          value={pricePerPerson}
          onChange={(event) => setPricePerPerson(Number(event.target.value) || 0)}
          required
        />
      </label>
      <label>
        Depósito (USD)
        <input
          type="number"
          min={100}
          value={deposit}
          onChange={(event) => setDeposit(Number(event.target.value) || 0)}
          required
        />
      </label>
      <label>
        Plan de pago
        <input value={paymentPlan} onChange={(event) => setPaymentPlan(event.target.value)} required />
      </label>
      <label className="request-full">
        Notas
        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} required />
      </label>

      <button className="button-dark" type="submit" disabled={sending}>
        {sending ? "Enviando paquete al cliente..." : "Guardar y notificar cliente"}
      </button>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </form>
  );
}
