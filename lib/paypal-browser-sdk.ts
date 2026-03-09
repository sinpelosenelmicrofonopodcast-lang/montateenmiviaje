let sdkLoadPromise: Promise<void> | null = null;

const DEFAULT_BUYER_COUNTRY = "US";
const ENABLE_FUNDING = "venmo,paylater,card";

export function loadPaypalBrowserSdk(clientId: string) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.paypal) {
    return Promise.resolve();
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

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
      "client-id": clientId,
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
