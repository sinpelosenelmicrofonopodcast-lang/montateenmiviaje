"use client";

import { useState } from "react";

interface ProposalResponseFormProps {
  requestId: string;
}

export function ProposalResponseForm({ requestId }: ProposalResponseFormProps) {
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<"accept" | "changes" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "changes") {
    setLoadingAction(action);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/custom-requests/${requestId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message: message.trim() || (action === "accept" ? "Acepto la propuesta." : "Solicito ajustes.")
        })
      });

      const payload = (await response.json()) as { requestStatus?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo registrar respuesta");
      }

      setFeedback(
        action === "accept"
          ? `Paquete aceptado. Estado: ${payload.requestStatus}`
          : `Solicitud de cambios enviada. Estado: ${payload.requestStatus}`
      );
      setMessage("");
    } catch (respondError) {
      const errMessage = respondError instanceof Error ? respondError.message : "Error inesperado";
      setError(errMessage);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="card">
      <h3>Responder propuesta</h3>
      <label>
        Comentario
        <textarea
          rows={4}
          placeholder="Confirma o solicita cambios específicos"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <div className="button-row">
        <button className="button-dark" type="button" onClick={() => void respond("accept")} disabled={!!loadingAction}>
          {loadingAction === "accept" ? "Procesando..." : "Aceptar paquete"}
        </button>
        <button className="button-outline" type="button" onClick={() => void respond("changes")} disabled={!!loadingAction}>
          {loadingAction === "changes" ? "Enviando..." : "Pedir modificaciones"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {feedback ? <p className="success">{feedback}</p> : null}
    </section>
  );
}
