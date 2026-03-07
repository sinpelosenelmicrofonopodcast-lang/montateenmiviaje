"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { PaymentMethodLink } from "@/lib/payment-links";
import { RafflePaymentMethodConfig } from "@/lib/types";

interface RaffleEntryFormProps {
  raffleId: string;
  isFree: boolean;
  paymentInstructions: string;
  paymentLinks?: PaymentMethodLink[];
  paymentMethods?: RafflePaymentMethodConfig[];
  paymentNote?: string;
  initialAvailableNumbers: number[];
}

export function RaffleEntryForm({
  raffleId,
  isFree,
  paymentInstructions,
  paymentLinks = [],
  paymentMethods = [],
  paymentNote,
  initialAvailableNumbers
}: RaffleEntryFormProps) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [publicDisplayName, setPublicDisplayName] = useState("");
  const [consentPublicListing, setConsentPublicListing] = useState(true);
  const [referredByCode, setReferredByCode] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState(initialAvailableNumbers);
  const [chosenNumber, setChosenNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabledPaymentMethods = useMemo(
    () =>
      paymentMethods
        .filter((method) => method.enabled)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [paymentMethods]
  );

  const selectedMethodConfig = useMemo(() => {
    if (!enabledPaymentMethods.length) return null;
    return enabledPaymentMethods.find((method) => method.provider === selectedPaymentMethod) ?? enabledPaymentMethods[0];
  }, [enabledPaymentMethods, selectedPaymentMethod]);

  useEffect(() => {
    if (!enabledPaymentMethods.length) {
      setSelectedPaymentMethod("");
      return;
    }
    setSelectedPaymentMethod((current) => {
      const exists = enabledPaymentMethods.some((method) => method.provider === current);
      return exists ? current : enabledPaymentMethods[0].provider;
    });
  }, [enabledPaymentMethods]);

  async function handleProofUpload(file: File) {
    setUploadingProof(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("raffleId", raffleId);

      const response = await fetch("/api/uploads/raffle-proof", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "No se pudo subir comprobante");
      }
      setPaymentScreenshotUrl(payload.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir comprobante");
    } finally {
      setUploadingProof(false);
    }
  }

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
    const requiresReference = Boolean(selectedMethodConfig?.requiresReference);
    const requiresScreenshot = Boolean(selectedMethodConfig?.requiresScreenshot);
    const normalizedReference = paymentReference.trim();

    if (!isFree && requiresReference && !normalizedReference) {
      setLoading(false);
      setError("Este método requiere referencia de pago.");
      return;
    }

    if (!isFree && requiresScreenshot && !paymentScreenshotUrl) {
      setLoading(false);
      setError("Este método requiere screenshot/comprobante.");
      return;
    }

    try {
      const response = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          customerEmail,
          chosenNumber: selectedNumber,
          note,
          paymentReference: normalizedReference || undefined,
          phone: phone || undefined,
          publicDisplayName: publicDisplayName || undefined,
          consentPublicListing,
          referredByCode: referredByCode || undefined,
          paymentMethod: selectedMethodConfig?.provider || undefined,
          paymentScreenshotUrl: paymentScreenshotUrl || undefined
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
      setPaymentScreenshotUrl("");
      setPhone("");
      setPublicDisplayName("");
      setReferredByCode("");
      setConsentPublicListing(true);
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
        Nombre para lista pública (opcional)
        <input value={publicDisplayName} onChange={(event) => setPublicDisplayName(event.target.value)} placeholder="Ej: Juan C." />
      </label>
      <label>
        Teléfono (opcional)
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ej: +1 787..." />
      </label>
      <label>
        Código de referido (opcional)
        <input value={referredByCode} onChange={(event) => setReferredByCode(event.target.value)} placeholder="Ej: JUAN-1234" />
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
          {enabledPaymentMethods.length > 0 ? (
            <div className="payment-links-grid">
              {enabledPaymentMethods.map((method) => (
                <button
                  key={method.provider}
                  type="button"
                  className={`payment-link-card ${selectedMethodConfig?.provider === method.provider ? "is-selected" : ""}`}
                  onClick={() => setSelectedPaymentMethod(method.provider)}
                >
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          ) : null}
          {selectedMethodConfig ? (
            <div className="card" style={{ marginTop: "12px" }}>
              <p><strong>Método seleccionado:</strong> {selectedMethodConfig.label}</p>
              {selectedMethodConfig.instructions ? <p className="muted">{selectedMethodConfig.instructions}</p> : null}
              {selectedMethodConfig.destinationValue ? (
                <p><strong>Destino:</strong> {selectedMethodConfig.destinationValue}</p>
              ) : null}
              {selectedMethodConfig.href ? (
                <p>
                  <a href={selectedMethodConfig.href} target="_blank" rel="noreferrer">
                    Ir al enlace de pago
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
          {enabledPaymentMethods.length === 0 && paymentLinks.length > 0 ? (
            <PaymentMethodLinks
              methods={paymentLinks}
              note={paymentNote}
              title="Pagar entrada"
            />
          ) : null}
          {selectedMethodConfig?.requiresReference ?? true ? (
            <label>
              Referencia de pago
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Ej: PAYPAL-ABC-123"
              />
            </label>
          ) : null}
          {selectedMethodConfig?.requiresScreenshot ? (
            <label>
              Screenshot/comprobante
              <input
                type="file"
                accept="image/*"
                disabled={uploadingProof}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) {
                    void handleProofUpload(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              {uploadingProof ? <span className="muted">Subiendo comprobante...</span> : null}
              {paymentScreenshotUrl ? (
                <span className="muted">
                  Comprobante subido. <a href={paymentScreenshotUrl} target="_blank" rel="noreferrer">Ver archivo</a>
                </span>
              ) : null}
            </label>
          ) : null}
        </>
      ) : null}
      <label>
        Nota adicional
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <label>
        <input
          type="checkbox"
          checked={consentPublicListing}
          onChange={(event) => setConsentPublicListing(event.target.checked)}
        />
        Permito aparecer en lista pública del sorteo
      </label>
      <button className="button-dark" type="submit" disabled={loading || availableNumbers.length === 0 || joined}>
        {loading ? "Enviando..." : availableNumbers.length === 0 ? "Números agotados" : "Enviar participación"}
      </button>
      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
