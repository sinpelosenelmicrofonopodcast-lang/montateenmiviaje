const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function getPaypalCredentials() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  return { clientId, clientSecret };
}

export async function getPaypalAccessToken() {
  const { clientId, clientSecret } = getPaypalCredentials();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal token error: ${detail}`);
  }

  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

export async function createPaypalOrder(amount: number, currency = "USD") {
  const token = await getPaypalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal create order error: ${detail}`);
  }

  const json = (await response.json()) as { id: string };
  return json.id;
}

export async function capturePaypalOrder(orderId: string) {
  const token = await getPaypalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal capture error: ${detail}`);
  }

  return (await response.json()) as {
    id: string;
    status: string;
    payer?: { email_address?: string };
  };
}
