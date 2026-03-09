"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RafflePayPalButton } from "@/components/raffle-paypal-button";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { PaymentMethodLink } from "@/lib/payment-links";
import { RafflePaymentMethodConfig } from "@/lib/types";
import styles from "./raffle-entry-form.module.css";

interface RaffleEntryFormProps {
  raffleId: string;
  isFree: boolean;
  paymentInstructions: string;
  paymentLinks?: PaymentMethodLink[];
  paymentMethods?: RafflePaymentMethodConfig[];
  paymentNote?: string;
  initialAvailableNumbers: number[];
  prefilledEmail?: string;
  isAuthenticated?: boolean;
  showNumberSelection?: boolean;
  compact?: boolean;
  selectedNumbers?: number[];
  onSelectedNumbersChange?: (numbers: number[]) => void;
  onEntriesCreated?: (numbers: number[]) => void;
}

function toProviderLabel(provider: string) {
  return provider.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function RaffleEntryForm({
  raffleId,
  isFree,
  paymentInstructions,
  paymentLinks = [],
  paymentMethods = [],
  paymentNote,
  initialAvailableNumbers,
  prefilledEmail,
  isAuthenticated = false,
  showNumberSelection = true,
  compact = false,
  selectedNumbers: selectedNumbersProp,
  onSelectedNumbersChange,
  onEntriesCreated
}: RaffleEntryFormProps) {
  const [fullName, setFullName] = useState("");
  const [customerEmail, setCustomerEmail] = useState(prefilledEmail ?? "");
  const [phone, setPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [publicDisplayName, setPublicDisplayName] = useState("");
  const [consentPublicListing, setConsentPublicListing] = useState(true);
  const [referredByCode, setReferredByCode] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reservationGroupId, setReservationGroupId] = useState<string | null>(null);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [reservedAmount, setReservedAmount] = useState<number | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState(initialAvailableNumbers);
  const [internalChosenNumbers, setInternalChosenNumbers] = useState<number[]>([]);
  const [numberQuery, setNumberQuery] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chosenNumbers = selectedNumbersProp ?? internalChosenNumbers;

  function setChosenNumbers(next: number[] | ((current: number[]) => number[])) {
    const resolved = typeof next === "function" ? next(chosenNumbers) : next;
    if (onSelectedNumbersChange) {
      onSelectedNumbersChange(resolved);
      return;
    }
    setInternalChosenNumbers(resolved);
  }

  useEffect(() => {
    if (prefilledEmail) {
      setCustomerEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const enabledPaymentMethods = useMemo(
    () =>
      paymentMethods
        .filter((method) => method.enabled)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [paymentMethods]
  );

  const filteredAvailableNumbers = useMemo(() => {
    const normalized = numberQuery.trim();
    if (!normalized) {
      return availableNumbers;
    }
    return availableNumbers.filter((number) => String(number).includes(normalized));
  }, [availableNumbers, numberQuery]);

  const selectedNumbersLabel = useMemo(() => {
    if (chosenNumbers.length === 0) return "";
    if (chosenNumbers.length <= 8) return chosenNumbers.map((value) => `#${value}`).join(", ");
    return `${chosenNumbers.slice(0, 8).map((value) => `#${value}`).join(", ")} +${chosenNumbers.length - 8} más`;
  }, [chosenNumbers]);

  const selectedMethodConfig = useMemo(() => {
    if (!enabledPaymentMethods.length) return null;
    return enabledPaymentMethods.find((method) => method.provider === selectedPaymentMethod) ?? enabledPaymentMethods[0];
  }, [enabledPaymentMethods, selectedPaymentMethod]);

  const isAutomaticPayPalFlow = !isFree
    && selectedMethodConfig?.provider === "paypal"
    && selectedMethodConfig.isAutomatic;
  const isSingleAutomaticPaypalMode = !isFree
    && enabledPaymentMethods.length === 1
    && isAutomaticPayPalFlow;

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

  useEffect(() => {
    if (!reservationGroupId || isAutomaticPayPalFlow) {
      return;
    }

    void fetch("/api/raffles/release-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationGroupId, reason: "cancelled" })
    });
    setReservationGroupId(null);
    setReservationExpiresAt(null);
    setReservedAmount(null);
  }, [isAutomaticPayPalFlow, reservationGroupId]);

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
    if (chosenNumbers.length === 0) {
      setError("Selecciona uno o más números disponibles.");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Ingresa tu nombre completo.");
      return;
    }

    if (!phone.trim()) {
      setError("Ingresa tu teléfono para confirmar la participación.");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

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
      if (isAutomaticPayPalFlow) {
        const reserveResponse = await fetch("/api/raffles/reserve-numbers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raffleId,
            customerEmail,
            chosenNumbers,
            fullName: fullName.trim(),
            phone: phone.trim(),
            note: note.trim() || undefined,
            referredByCode: referredByCode.trim() || undefined
          })
        });

        const reservePayload = (await reserveResponse.json()) as {
          message?: string;
          reservation?: {
            reservationGroupId: string;
            reservationExpiresAt: string;
            amount: number;
          };
        };

        if (!reserveResponse.ok || !reservePayload.reservation?.reservationGroupId) {
          throw new Error(reservePayload.message ?? "No se pudieron reservar los números");
        }

        setReservationGroupId(reservePayload.reservation.reservationGroupId);
        setReservationExpiresAt(reservePayload.reservation.reservationExpiresAt);
        setReservedAmount(Number(reservePayload.reservation.amount));
        setSuccess(
          `Reserva temporal creada para ${selectedNumbersLabel}. Completa el pago en PayPal antes de ${
            new Date(reservePayload.reservation.reservationExpiresAt).toLocaleTimeString("es-PR", {
              hour: "2-digit",
              minute: "2-digit"
            })
          }.`
        );
        return;
      }

      const response = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          customerEmail,
          chosenNumbers,
          note: note.trim() || undefined,
          paymentReference: normalizedReference || undefined,
          phone: phone.trim(),
          publicDisplayName: (publicDisplayName.trim() || fullName.trim()) || undefined,
          consentPublicListing,
          referredByCode: referredByCode.trim() || undefined,
          paymentMethod: selectedMethodConfig?.provider || undefined,
          paymentScreenshotUrl: paymentScreenshotUrl || undefined
        })
      });

      const payload = (await response.json()) as {
        message?: string;
        total?: number;
        entry?: { status: string };
        entries?: Array<{ chosenNumber: number; status: string }>;
      };
      if (!response.ok || !payload.entries || payload.entries.length === 0) {
        throw new Error(payload.message ?? "No se pudo registrar participación");
      }

      setSuccess(
        `Se enviaron ${payload.total ?? payload.entries.length} número(s): ${
          payload.entries.map((item) => `#${item.chosenNumber}`).join(", ")
        }. Estado: ${payload.entry?.status ?? payload.entries[0].status}.`
      );
      const submittedNumbers = [...chosenNumbers];
      setAvailableNumbers((current) => current.filter((number) => !chosenNumbers.includes(number)));
      setChosenNumbers([]);
      onEntriesCreated?.(submittedNumbers);
      setPaymentReference("");
      setPaymentScreenshotUrl("");
      setNote("");
      setReferredByCode("");
      setReservationGroupId(null);
      setReservationExpiresAt(null);
      setReservedAmount(null);
    } catch (joinError) {
      const errMessage = joinError instanceof Error ? joinError.message : "Error inesperado";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  }

  const noNumbersLeft = availableNumbers.length === 0;
  const requiresReference = Boolean(selectedMethodConfig?.requiresReference);
  const requiresScreenshot = Boolean(selectedMethodConfig?.requiresScreenshot);
  const fallbackPaymentMethods =
    enabledPaymentMethods.length === 0 && paymentLinks.length > 0 ? paymentLinks : [];

  return (
    <form className={`card ${styles.form}`} onSubmit={handleJoin}>
      {!compact ? (
        <div className={styles.header}>
          <p className={styles.eyebrow}>Participación oficial</p>
          <h3 className={styles.title}>Completa tu entrada en minutos</h3>
          <p className={styles.subtitle}>
            Flujo rápido: elige número, confirma datos y completa pago según el método disponible.
          </p>
        </div>
      ) : null}

      {compact ? null : (
        <div className={styles.loginStrip}>
          {isAuthenticated ? (
            <p>
              Sesión activa detectada. Usa este mismo email para validar tu participación.
            </p>
          ) : (
            <p>
              Debes estar registrado para participar.{" "}
              <Link href="/portal/login">Inicia sesión</Link> o{" "}
              <Link href="/registro">crea tu cuenta</Link>.
            </p>
          )}
        </div>
      )}

      {showNumberSelection ? (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h4>1) Elige tu número</h4>
          <p>Números disponibles: <strong>{availableNumbers.length}</strong></p>
        </div>
        <div className={styles.numberToolbar}>
          <label>
            Buscar número
            <input
              value={numberQuery}
              onChange={(event) => setNumberQuery(event.target.value)}
              placeholder="Ej: 24"
              inputMode="numeric"
            />
          </label>
          <button
            type="button"
            className="button-outline"
            onClick={() => {
              if (!availableNumbers.length) return;
              const availableToPick = availableNumbers.filter((number) => !chosenNumbers.includes(number));
              if (!availableToPick.length) return;
              const random = availableToPick[Math.floor(Math.random() * availableToPick.length)];
              setChosenNumbers((current) => [...current, random]);
            }}
            disabled={noNumbersLeft}
          >
            Número aleatorio
          </button>
          <button
            type="button"
            className="button-outline"
            onClick={() => setChosenNumbers([])}
            disabled={chosenNumbers.length === 0}
          >
            Limpiar selección
          </button>
        </div>
        <div className={styles.numberGrid}>
          {filteredAvailableNumbers.slice(0, 240).map((number) => (
            <button
              key={number}
              type="button"
              className={`${styles.numberTile} ${chosenNumbers.includes(number) ? styles.numberTileActive : ""}`}
              onClick={() => {
                setChosenNumbers((current) => (
                  current.includes(number)
                    ? current.filter((value) => value !== number)
                    : [...current, number]
                ));
              }}
            >
              #{number}
            </button>
          ))}
          {filteredAvailableNumbers.length === 0 ? (
            <p className={styles.emptyNumbers}>No hay resultados con esa búsqueda.</p>
          ) : null}
        </div>
        {chosenNumbers.length > 0 ? (
          <p className={styles.selectionNotice}>
            Números seleccionados (<strong>{chosenNumbers.length}</strong>): <strong>{selectedNumbersLabel}</strong>
          </p>
        ) : null}
      </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h4>{showNumberSelection ? "2) Tus datos" : "Tus datos"}</h4>
          <p>Campos principales para validar tu entrada.</p>
        </div>
        <div className={styles.fieldGrid}>
          <label>
            Nombre completo
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ej: María Rodríguez"
              required
            />
          </label>
          <label>
            Email registrado
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="tu@email.com"
              required
            />
          </label>
          <label>
            Teléfono
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej: +1 787 000 0000"
              required
            />
          </label>
        </div>
        {!compact ? (
          <button
            type="button"
            className="button-outline"
            onClick={() => setShowAdvancedFields((value) => !value)}
          >
            {showAdvancedFields ? "Ocultar campos opcionales" : "Mostrar campos opcionales"}
          </button>
        ) : null}
        {showAdvancedFields && !compact ? (
          <div className={styles.fieldGrid} style={{ marginTop: "10px" }}>
            <label>
              Nombre público (opcional)
              <input
                value={publicDisplayName}
                onChange={(event) => setPublicDisplayName(event.target.value)}
                placeholder="Ej: Juan C."
              />
            </label>
            <label>
              Código de referido (opcional)
              <input
                value={referredByCode}
                onChange={(event) => setReferredByCode(event.target.value)}
                placeholder="Ej: MONTATE-1234"
              />
            </label>
            <label className={styles.fullWidth}>
              Nota adicional (opcional)
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : null}

        {!compact ? (
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={consentPublicListing}
              onChange={(event) => setConsentPublicListing(event.target.checked)}
            />
            Permito aparecer en la lista pública de participantes (sin exponer email/teléfono).
          </label>
        ) : null}
      </section>

      {!isFree ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4>3) Método de pago</h4>
            <p>{isSingleAutomaticPaypalMode ? "Checkout seguro con PayPal API." : "Selecciona cómo pagar y sigue instrucciones."}</p>
          </div>
          {compact || isSingleAutomaticPaypalMode ? null : <p className={styles.instructions}><strong>Instrucciones:</strong> {paymentInstructions}</p>}
          {enabledPaymentMethods.length > 0 && !isSingleAutomaticPaypalMode ? (
            <div className={styles.paymentMethodGrid}>
              {enabledPaymentMethods.map((method) => (
                <button
                  key={method.provider}
                  type="button"
                  className={`${styles.paymentMethodCard} ${
                    selectedMethodConfig?.provider === method.provider ? styles.paymentMethodCardActive : ""
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.provider)}
                >
                  <p>{method.label || toProviderLabel(method.provider)}</p>
                  <div className={styles.methodMeta}>
                    {method.requiresReference ? <span>Requiere referencia</span> : null}
                    {method.requiresScreenshot ? <span>Requiere comprobante</span> : null}
                    {method.isAutomatic ? <span>Aprobación automática</span> : <span>Revisión manual</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {selectedMethodConfig ? (
            <div className={styles.paymentDetail}>
              <p><strong>Método seleccionado:</strong> {selectedMethodConfig.label}</p>
              {selectedMethodConfig.instructions ? <p className="muted">{selectedMethodConfig.instructions}</p> : null}
              {selectedMethodConfig.destinationValue && !isAutomaticPayPalFlow ? (
                <p><strong>Destino de pago:</strong> {selectedMethodConfig.destinationValue}</p>
              ) : null}
              {selectedMethodConfig.href && !isAutomaticPayPalFlow ? (
                <a className="button-outline" href={selectedMethodConfig.href} target="_blank" rel="noreferrer">
                  Ir al enlace de pago
                </a>
              ) : null}
            </div>
          ) : null}

          {fallbackPaymentMethods.length > 0 && !isAutomaticPayPalFlow ? (
            <PaymentMethodLinks methods={fallbackPaymentMethods} note={paymentNote} title="Opciones de pago activas" />
          ) : null}

          {requiresReference ? (
            <label>
              Referencia de pago
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Ej: PAYPAL-ABC-123"
              />
            </label>
          ) : null}

      {requiresScreenshot ? (
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
        </section>
      ) : null}

      <div className={styles.submitRow}>
        <button
          className="button-dark"
          type="submit"
          disabled={loading || noNumbersLeft || (isAutomaticPayPalFlow && Boolean(reservationGroupId))}
        >
          {loading
            ? "Procesando..."
            : noNumbersLeft
              ? "Números agotados"
              : isAutomaticPayPalFlow
                ? reservationGroupId
                  ? "Reserva creada"
                  : "Reservar y pagar con PayPal"
                : compact
                  ? "Confirmar participación"
                  : `Confirmar ${Math.max(chosenNumbers.length, 1)} número(s)`}
        </button>
      </div>

      {isAutomaticPayPalFlow && reservationGroupId ? (
        <div className={styles.paymentDetail}>
          <p><strong>Reserva lista para pagar:</strong> {selectedNumbersLabel}</p>
          {reservedAmount !== null ? <p><strong>Total:</strong> {reservedAmount.toFixed(2)} USD</p> : null}
          {reservationExpiresAt ? (
            <p className="muted">
              Expira: {new Date(reservationExpiresAt).toLocaleString("es-PR")}
            </p>
          ) : null}
          <RafflePayPalButton
            reservationGroupId={reservationGroupId}
            onPaid={({ assignedNumbers }) => {
              const assigned = assignedNumbers.length > 0 ? assignedNumbers : chosenNumbers;
              setAvailableNumbers((current) => current.filter((number) => !assigned.includes(number)));
              onEntriesCreated?.(assigned);
              setChosenNumbers([]);
              setPaymentReference("");
              setPaymentScreenshotUrl("");
              setNote("");
              setReferredByCode("");
              setReservationGroupId(null);
              setReservationExpiresAt(null);
              setReservedAmount(null);
              setSuccess(`Pago confirmado. Tus números fueron asignados: ${assigned.map((value) => `#${value}`).join(", ")}.`);
              setError(null);
            }}
            onCancelled={() => {
              setReservationGroupId(null);
              setReservationExpiresAt(null);
              setReservedAmount(null);
              setError("Pago cancelado. Tus números fueron liberados.");
            }}
          />
        </div>
      ) : null}

      {compact ? null : (
        <p className={styles.trustCopy}>
          Tu entrada se procesa con validación de número y registro auditable. Recibirás confirmación una vez sea revisada.
        </p>
      )}

      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
