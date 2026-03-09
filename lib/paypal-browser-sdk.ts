let sdkLoadPromise: Promise<void> | null = null;
let clientIdLoadPromise: Promise<string> | null = null;

const DEFAULT_BUYER_COUNTRY = "US";
const ENABLE_FUNDING = "venmo,paylater,card";

declare global {
  interface Window {
    __MONTATE_PAYPAL_CLIENT_ID__?: string;
  }
}

async function resolvePayPalClientId(explicitClientId?: string) {
  const direct = explicitClientId?.trim();
  if (direct) {
    return direct;
  }

  const fromBundle = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  if (fromBundle) {
    return fromBundle;
  }

  if (typeof window !== "undefined" && window.__MONTATE_PAYPAL_CLIENT_ID__) {
    return window.__MONTATE_PAYPAL_CLIENT_ID__;
  }

  if (!clientIdLoadPromise) {
    clientIdLoadPromise = (async () => {
      const response = await fetch("/api/paypal/client-config", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const payload = (await response.json()) as { clientId?: string; message?: string };

      if (!response.ok || !payload.clientId) {
        throw new Error(payload.message ?? "PayPal no está configurado en este momento.");
      }

      if (typeof window !== "undefined") {
        window.__MONTATE_PAYPAL_CLIENT_ID__ = payload.clientId;
      }
      return payload.clientId;
    })().catch((error) => {
      clientIdLoadPromise = null;
      throw error;
    });
  }

  return clientIdLoadPromise;
}

export async function loadPaypalBrowserSdk(clientId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.paypal) {
    return;
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  const resolvedClientId = await resolvePayPalClientId(clientId);

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk='true']");
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      const onLoad = () => {
        existing.dataset.loaded = "true";
        resolve();
      };
      const onError = () => reject(new Error("No se pudo cargar PayPal SDK"));
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const params = new URLSearchParams({
      "client-id": resolvedClientId,
      currency: "USD",
      components: "buttons",
      intent: "capture",
      "enable-funding": ENABLE_FUNDING,
      "buyer-country":
        process.env.NEXT_PUBLIC_PAYPAL_BUYER_COUNTRY?.trim() || DEFAULT_BUYER_COUNTRY
    });

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.dataset.sdkIntegrationSource = "developer-studio";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar PayPal SDK"));
    document.body.appendChild(script);
  }).catch((error) => {
    sdkLoadPromise = null;
    throw error;
  });

  return sdkLoadPromise;
}
