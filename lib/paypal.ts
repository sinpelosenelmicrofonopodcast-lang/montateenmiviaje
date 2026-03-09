import "server-only";

export type PayPalEnvironment = "sandbox" | "live";

export interface PayPalOrderAmount {
  currencyCode?: string;
  currency_code?: string;
  value: string;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount?: PayPalOrderAmount;
  final_capture?: boolean;
}

export interface PayPalOrderDetails {
  id: string;
  status: string;
  intent?: "CAPTURE";
  payer?: {
    payer_id?: string;
    email_address?: string;
  };
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: PayPalOrderAmount;
    payments?: {
      captures?: PayPalCapture[];
    };
  }>;
}

function normalizePayPalEnvironment(value: string | undefined): PayPalEnvironment {
  return value?.trim().toLowerCase() === "live" ? "live" : "sandbox";
}

export function getPayPalEnvironment() {
  return normalizePayPalEnvironment(process.env.PAYPAL_ENV);
}

export function getPayPalApiBase() {
  if (process.env.PAYPAL_BASE_URL?.trim()) {
    return process.env.PAYPAL_BASE_URL.trim();
  }

  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getPaypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  return { clientId, clientSecret };
}

export function getPayPalClientIdPublic() {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || process.env.PAYPAL_CLIENT_ID?.trim() || "";
}

async function parsePayPalResponse<T>(response: Response, context: string): Promise<T> {
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const detail =
      typeof parsed?.message === "string"
        ? parsed.message
        : Array.isArray(parsed?.details) && parsed.details.length > 0
          ? JSON.stringify(parsed.details)
          : text || "Unknown PayPal error";
    throw new Error(`${context}: ${detail}`);
  }

  return parsed as T;
}

export async function getPaypalAccessToken() {
  const { clientId, clientSecret } = getPaypalCredentials();

  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });

  const json = await parsePayPalResponse<{ access_token: string }>(response, "PayPal token error");
  return json.access_token;
}

export async function createPayPalOrder(input: {
  amount: number;
  currency?: string;
  customId?: string;
  referenceId?: string;
  description?: string;
}) {
  const token = await getPaypalAccessToken();
  const currency = (input.currency ?? "USD").toUpperCase();

  const response = await fetch(`${getPayPalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.customId,
          description: input.description,
          amount: {
            currency_code: currency,
            value: input.amount.toFixed(2)
          }
        }
      ]
    }),
    cache: "no-store"
  });

  return parsePayPalResponse<PayPalOrderDetails>(response, "PayPal create order error");
}

export async function getPayPalOrder(orderId: string) {
  const token = await getPaypalAccessToken();
  const response = await fetch(`${getPayPalApiBase()}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  return parsePayPalResponse<PayPalOrderDetails>(response, "PayPal get order error");
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getPaypalAccessToken();
  const response = await fetch(`${getPayPalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  return parsePayPalResponse<PayPalOrderDetails>(response, "PayPal capture error");
}

export async function verifyPayPalWebhookSignature(input: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookEvent: Record<string, unknown>;
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    return { verified: false, skipped: true };
  }

  const token = await getPaypalAccessToken();
  const response = await fetch(`${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transmission_id: input.transmissionId,
      transmission_time: input.transmissionTime,
      cert_url: input.certUrl,
      auth_algo: input.authAlgo,
      transmission_sig: input.transmissionSig,
      webhook_id: webhookId,
      webhook_event: input.webhookEvent
    }),
    cache: "no-store"
  });

  const result = await parsePayPalResponse<{ verification_status?: string }>(
    response,
    "PayPal webhook verification error"
  );
  return {
    verified: (result.verification_status ?? "").toUpperCase() === "SUCCESS",
    skipped: false
  };
}

// Backward-compatible wrappers used by legacy booking routes/components.
export async function createPaypalOrder(amount: number, currency = "USD") {
  const order = await createPayPalOrder({ amount, currency });
  return order.id;
}

export async function capturePaypalOrder(orderId: string) {
  const capture = await capturePayPalOrder(orderId);
  return {
    id: capture.id,
    status: capture.status,
    payer: {
      email_address: capture.payer?.email_address
    }
  };
}
