"use client";

import { useState } from "react";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { PaymentMethodLink } from "@/lib/payment-links";

interface RaffleEntryFormProps {
  raffleId: string;
  isFree: boolean;
  paymentInstructions: string;
  paymentLinks?: PaymentMethodLink[];
  paymentNote?: string;
  initialAvailableNumbers: number[];
}

export function RaffleEntryForm({
  raffleId,
  isFree,
  paymentInstructions,
  paymentLinks = [],
  paymentNote,
  initialAvailableNumbers
}: RaffleEntryFormProps) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState(initialAvailableNumbers);
  const [chosenNumber, setChosenNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosenNumber) {
      setError("Selecciona un número disponible");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

    const selectedNumber = Number(chosenNumber);

    try {
      const response = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          customerEmail,
          chosenNumber: selectedNumber,
          note,
          paymentReference: paymentReference || undefined
        })
      });

      const payload = (await response.json()) as { message?: string; entry?: { status: string } };
      if (!response.ok || !payload.entry) {
        throw new Error(payload.message ?? "No se pudo registrar participación");
      }

      setSuccess(`Número ${selectedNumber} reservado. Estado: ${payload.entry.status}`);
      setJoined(true);
      setAvailableNumbers((current) => current.filter((number) => number !== selectedNumber));
      setChosenNumber("");
      setNote("");
      setPaymentReference("");
    } catch (joinError) {
      const errMessage = joinError instanceof Error ? joinError.message : "Error inesperado";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleJoin}>
      <h3>Participar</h3>
      <p className="muted">Debes usar el mismo correo con el que te registraste.</p>
      <p className="muted">
        Números disponibles: <strong>{availableNumbers.length}</strong>
      </p>
      <label>
        Correo registrado
        <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} required />
      </label>
      <label>
        Elige tu número de lotería
        <select
          value={chosenNumber}
          onChange={(event) => setChosenNumber(event.target.value)}
          required
          disabled={availableNumbers.length === 0 || joined}
        >
          <option value="">Selecciona un número</option>
          {availableNumbers.map((number) => (
            <option key={number} value={number}>
              #{number}
            </option>
          ))}
        </select>
      </label>
      {!isFree ? (
        <>
          <p className="muted"><strong>Instrucciones de pago:</strong> {paymentInstructions}</p>
          {paymentLinks.length > 0 ? (
            <PaymentMethodLinks
              methods={paymentLinks}
              note={paymentNote}
              title="Pagar entrada"
            />
          ) : null}
          <label>
            Referencia de pago
            <input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Ej: PAYPAL-ABC-123"
            />
          </label>
        </>
      ) : null}
      <label>
        Nota adicional
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button className="button-dark" type="submit" disabled={loading || availableNumbers.length === 0 || joined}>
        {loading ? "Enviando..." : availableNumbers.length === 0 ? "Números agotados" : "Enviar participación"}
      </button>
      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
