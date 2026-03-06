import { NextResponse } from "next/server";
import { markBookingPaidByOrderService } from "@/lib/runtime-service";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      event_type?: string;
      resource?: { supplementary_data?: { related_ids?: { order_id?: string } }; id?: string };
    };

    const eventType = payload.event_type ?? "";
    if (eventType.includes("PAYMENT.CAPTURE.COMPLETED")) {
      const orderId = payload.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        await markBookingPaidByOrderService(orderId);
      }
    }
  } catch (error) {
    console.error("Webhook PayPal no procesado", error);
  }

  return NextResponse.json({ received: true });
}
