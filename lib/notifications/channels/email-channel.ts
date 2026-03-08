import { sendEmailNotification } from "@/lib/email";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  ok: boolean;
  provider: string;
  response: Record<string, unknown>;
  error?: string;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function persistEmailLog(input: {
  to: string;
  subject: string;
  provider: string;
  preview: string;
  sentAt: string;
}) {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdminClient();
  await supabase.from("app_email_logs").insert({
    recipient: normalizeEmail(input.to),
    subject: input.subject,
    body_preview: input.preview,
    provider: input.provider === "resend" ? "resend" : "simulated",
    sent_at: input.sentAt
  });
}

export async function sendTransactionalEmail(input: EmailSendInput): Promise<EmailSendResult> {
  try {
    const sent = await sendEmailNotification({
      to: normalizeEmail(input.to),
      subject: input.subject,
      html: input.html,
      text: input.text
    });

    await persistEmailLog({
      to: sent.to,
      subject: sent.subject,
      provider: sent.provider,
      preview: sent.bodyPreview,
      sentAt: sent.sentAt
    });

    return {
      ok: true,
      provider: sent.provider,
      response: {
        id: sent.id,
        sentAt: sent.sentAt
      }
    };
  } catch (error) {
    return {
      ok: false,
      provider: "email",
      response: {},
      error: error instanceof Error ? error.message : "Email error"
    };
  }
}
