import { randomUUID } from "crypto";
import { EmailLog } from "@/lib/types";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmailNotification(input: SendEmailInput): Promise<EmailLog> {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Móntate en mi viaje <no-reply@montateenmiviaje.com>";

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text
        }),
        cache: "no-store"
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Resend error");
      }

      return {
        id: randomUUID(),
        to: input.to,
        subject: input.subject,
        bodyPreview: input.text.slice(0, 160),
        sentAt: new Date().toISOString(),
        provider: "resend"
      };
    } catch (error) {
      console.error("Email send failed, fallback to simulated.", error);
    }
  }

  return {
    id: randomUUID(),
    to: input.to,
    subject: input.subject,
    bodyPreview: input.text.slice(0, 160),
    sentAt: new Date().toISOString(),
    provider: "simulated"
  };
}
