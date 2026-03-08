import { truncatePushMessage } from "@/lib/notifications/templates";

export interface PushSendInput {
  externalId: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

export interface PushSendResult {
  ok: boolean;
  provider: string;
  response: Record<string, unknown>;
  error?: string;
}

function getOneSignalConfig() {
  const appId = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_API_KEY;
  return { appId, apiKey };
}

export async function sendPushNotification(input: PushSendInput): Promise<PushSendResult> {
  const config = getOneSignalConfig();

  if (!config.appId || !config.apiKey) {
    return {
      ok: false,
      provider: "onesignal",
      response: {},
      error: "OneSignal no configurado"
    };
  }

  try {
    const payload: Record<string, unknown> = {
      app_id: config.appId,
      include_aliases: {
        external_id: [input.externalId]
      },
      target_channel: "push",
      headings: { en: input.title, es: input.title },
      contents: {
        en: truncatePushMessage(input.message, 160),
        es: truncatePushMessage(input.message, 160)
      },
      data: input.data ?? {}
    };

    if (input.link) {
      payload.url = input.link;
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        ok: false,
        provider: "onesignal",
        response: json,
        error: typeof json.errors === "string" ? json.errors : `HTTP ${response.status}`
      };
    }

    return {
      ok: true,
      provider: "onesignal",
      response: json
    };
  } catch (error) {
    return {
      ok: false,
      provider: "onesignal",
      response: {},
      error: error instanceof Error ? error.message : "Push error"
    };
  }
}
