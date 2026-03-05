"use client";

import { useEffect, useMemo, useState } from "react";

interface PaypalButtonProps {
  bookingId: string;
  amount: number;
  onPaid: (orderId: string) => void;
}

function loadPaypalSdk(clientId: string) {
  const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk='true']");
  if (existing) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar PayPal SDK"));
    document.body.appendChild(script);
  });
}

export function PaypalButton({ bookingId, amount, onPaid }: PaypalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const buttonContainerId = useMemo(() => `paypal-buttons-${bookingId}`, [bookingId]);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
          throw new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado");
        }

        await loadPaypalSdk(clientId);
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

              if (!response.ok) {
                const payload = (await response.json()) as { message?: string };
                throw new Error(payload.message ?? "No se pudo crear la orden de PayPal");
              }

              const payload = (await response.json()) as { orderId: string };
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
