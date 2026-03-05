import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: validar firma del webhook PayPal y reconciliar pagos asíncronos.
  console.log("PayPal webhook payload", payload);

  return NextResponse.json({ received: true });
}
