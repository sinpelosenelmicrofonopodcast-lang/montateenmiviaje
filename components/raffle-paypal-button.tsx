"use client";

import { useEffect, useMemo, useState } from "react";
import { loadPaypalBrowserSdk } from "@/lib/paypal-browser-sdk";

interface RafflePayPalButtonProps {
  reservationGroupId: string;
  disabled?: boolean;
  onPaid: (result: {
    orderId: string;
    assignedNumbers: number[];
    reservationGroupId?: string;
    idempotent?: boolean;
  }) => void;
  onCancelled?: () => void;
}

export function RafflePayPalButton({ reservationGroupId, disabled, onPaid, onCancelled }: RafflePayPalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const buttonContainerId = useMemo(
    () => `paypal-raffle-buttons-${reservationGroupId}`,
    [reservationGroupId]
  );

  useEffect(() => {
    if (!reservationGroupId || disabled) {
      return;
    }

    let mounted = true;

    async function setup() {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
          throw new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado");
        }

        await loadPaypalBrowserSdk(clientId);
        if (!mounted || !window.paypal) {
          return;
        }

        setReady(true);
        await window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "pay"
            },
            createOrder: async () => {
              const response = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reservationGroupId })
              });

              const payload = (await response.json()) as { message?: string; orderId?: string };
              if (!response.ok || !payload.orderId) {
                throw new Error(payload.message ?? "No se pudo crear la orden de PayPal");
              }

              return payload.orderId;
            },
            onApprove: async (data) => {
              const response = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reservationGroupId, orderId: data.orderID })
              });

              const payload = (await response.json()) as {
                message?: string;
                assignedNumbers?: number[];
                reservationGroupId?: string;
                idempotent?: boolean;
              };

              if (!response.ok) {
                throw new Error(payload.message ?? "No se pudo capturar el pago PayPal");
              }

              onPaid({
                orderId: data.orderID,
                assignedNumbers: payload.assignedNumbers ?? [],
                reservationGroupId: payload.reservationGroupId,
                idempotent: payload.idempotent
              });
            },
            onCancel: async () => {
              await fetch("/api/raffles/release-reservation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reservationGroupId, reason: "cancelled" })
              });
              onCancelled?.();
            },
            onError: (sdkError) => {
              console.error("PayPal raffle SDK error", sdkError);
              setError("No se pudo completar el pago en PayPal. Intenta de nuevo.");
            }
          })
          .render(`#${buttonContainerId}`);
      } catch (setupError) {
        const message = setupError instanceof Error ? setupError.message : "Error desconocido";
        setError(message);
      }
    }

    void setup();

    return () => {
      mounted = false;
      const container = document.getElementById(buttonContainerId);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [buttonContainerId, disabled, onCancelled, onPaid, reservationGroupId]);

  return (
    <div className="paypal-shell">
      <div id={buttonContainerId} />
      {!ready && !error ? <p className="muted">Cargando PayPal...</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
