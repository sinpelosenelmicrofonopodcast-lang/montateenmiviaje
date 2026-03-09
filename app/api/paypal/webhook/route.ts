import { NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";
import { captureRafflePayPalOrderService } from "@/lib/raffles-service";
import { markBookingPaidByOrderService } from "@/lib/runtime-service";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      event_type?: string;
      resource?: { supplementary_data?: { related_ids?: { order_id?: string } }; id?: string };
    };

    const transmissionId = request.headers.get("paypal-transmission-id");
    const transmissionTime = request.headers.get("paypal-transmission-time");
    const certUrl = request.headers.get("paypal-cert-url");
    const authAlgo = request.headers.get("paypal-auth-algo");
    const transmissionSig = request.headers.get("paypal-transmission-sig");

    if (transmissionId && transmissionTime && certUrl && authAlgo && transmissionSig) {
      const signature = await verifyPayPalWebhookSignature({
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
        webhookEvent: payload as unknown as Record<string, unknown>
      });
      if (!signature.skipped && !signature.verified) {
        return NextResponse.json({ message: "Firma webhook PayPal inválida" }, { status: 400 });
      }
    }

    const eventType = payload.event_type ?? "";
    if (eventType.includes("PAYMENT.CAPTURE.COMPLETED")) {
      const orderId = payload.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        await Promise.allSettled([
          markBookingPaidByOrderService(orderId),
          captureRafflePayPalOrderService({ orderId })
        ]);
      }
    }
  } catch (error) {
    console.error("Webhook PayPal no procesado", error);
  }

  return NextResponse.json({ received: true });
}
