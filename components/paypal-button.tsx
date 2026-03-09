"use client";

import { useEffect, useMemo, useState } from "react";
import { loadPaypalBrowserSdk } from "@/lib/paypal-browser-sdk";

interface PaypalButtonProps {
  bookingId: string;
  amount: number;
  onPaid: (orderId: string) => void;
}

export function PaypalButton({ bookingId, amount, onPaid }: PaypalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const buttonContainerId = useMemo(() => `paypal-buttons-${bookingId}`, [bookingId]);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await loadPaypalBrowserSdk();
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
                body: JSON.stringify({ bookingId, amount })
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
                body: JSON.stringify({ bookingId, orderId: data.orderID })
              });

              if (!response.ok) {
                const payload = (await response.json()) as { message?: string };
                throw new Error(payload.message ?? "No se pudo capturar el pago");
              }

              onPaid(data.orderID);
            },
            onError: (sdkError) => {
              console.error("PayPal SDK error", sdkError);
              setError("Ocurrió un error al procesar el pago con PayPal.");
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
  }, [amount, bookingId, buttonContainerId, onPaid]);

  return (
    <div className="paypal-shell">
      <div id={buttonContainerId} />
      {!ready && !error ? <p className="muted">Cargando PayPal...</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
