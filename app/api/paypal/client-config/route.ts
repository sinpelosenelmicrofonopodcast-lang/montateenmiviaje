import { NextResponse } from "next/server";
import { getPayPalClientIdPublic, getPayPalEnvironment } from "@/lib/paypal";

export async function GET() {
  const clientId = getPayPalClientIdPublic();

  if (!clientId) {
    return NextResponse.json(
      { message: "PayPal no está configurado en el servidor.", configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    clientId,
    environment: getPayPalEnvironment()
  });
}

