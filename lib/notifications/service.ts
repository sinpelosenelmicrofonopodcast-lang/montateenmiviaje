import "server-only";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { sendTransactionalEmail } from "@/lib/notifications/channels/email-channel";
import { sendPushNotification } from "@/lib/notifications/channels/push-channel";
import { dispatchNotificationEvent, DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/orchestrator";
import {
  NotificationDeliveryItem,
  NotificationEventItem,
  NotificationListItem,
  NotificationRecipientScope,
  UserNotificationPreferences
} from "@/lib/notifications/types";

interface ListUserNotificationsInput {
  unreadOnly?: boolean;
  kind?: string;
  limit?: number;
  offset?: number;
}

interface ListAdminNotificationInput {
  eventType?: string;
  channel?: string;
  status?: string;
  userId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

function isSchemaErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist")
    || normalized.includes("could not find the table")
    || normalized.includes("schema cache")
    || normalized.includes("column")
  );
}

function parseDate(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toPreferences(userId: string, row?: Record<string, unknown> | null): UserNotificationPreferences {
  return {
    userId,
    pushEnabled: typeof row?.push_enabled === "boolean" ? row.push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.pushEnabled,
    emailEnabled: typeof row?.email_enabled === "boolean" ? row.email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
    marketingPushEnabled: typeof row?.marketing_push_enabled === "boolean" ? row.marketing_push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.marketingPushEnabled,
    marketingEmailEnabled: typeof row?.marketing_email_enabled === "boolean" ? row.marketing_email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.marketingEmailEnabled,
    transactionalPushEnabled: typeof row?.transactional_push_enabled === "boolean" ? row.transactional_push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.transactionalPushEnabled,
    transactionalEmailEnabled: typeof row?.transactional_email_enabled === "boolean" ? row.transactional_email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.transactionalEmailEnabled,
    rafflePushEnabled: typeof row?.raffle_push_enabled === "boolean" ? row.raffle_push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.rafflePushEnabled,
    raffleEmailEnabled: typeof row?.raffle_email_enabled === "boolean" ? row.raffle_email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.raffleEmailEnabled,
    tripPushEnabled: typeof row?.trip_push_enabled === "boolean" ? row.trip_push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.tripPushEnabled,
    tripEmailEnabled: typeof row?.trip_email_enabled === "boolean" ? row.trip_email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.tripEmailEnabled,
    paymentPushEnabled: typeof row?.payment_push_enabled === "boolean" ? row.payment_push_enabled : DEFAULT_NOTIFICATION_PREFERENCES.paymentPushEnabled,
    paymentEmailEnabled: typeof row?.payment_email_enabled === "boolean" ? row.payment_email_enabled : DEFAULT_NOTIFICATION_PREFERENCES.paymentEmailEnabled,
    createdAt: parseDate(row?.created_at),
    updatedAt: parseDate(row?.updated_at)
  };
}

export async function getUserNotificationPreferencesService(userId: string): Promise<UserNotificationPreferences> {
  if (!hasSupabaseConfig()) {
    return toPreferences(userId, null);
  }

  const supabase = getSupabaseAdminClient();
  const row = await supabase
    .from("app_user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Record<string, unknown>>();

  if (row.error) {
    if (isSchemaErrorMessage(row.error.message)) {
      return toPreferences(userId, null);
    }
    throw new Error(`No se pudieron cargar preferencias de notificación: ${row.error.message}`);
  }

  if (!row.data) {
    return toPreferences(userId, null);
  }

  return toPreferences(userId, row.data);
}

export async function updateUserNotificationPreferencesService(
  userId: string,
  input: Partial<Omit<UserNotificationPreferences, "userId" | "createdAt" | "updatedAt">>
) {
  if (!hasSupabaseConfig()) {
    return toPreferences(userId, input as Record<string, unknown>);
  }

  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = { user_id: userId };

  if (typeof input.pushEnabled === "boolean") payload.push_enabled = input.pushEnabled;
  if (typeof input.emailEnabled === "boolean") payload.email_enabled = input.emailEnabled;
  if (typeof input.marketingPushEnabled === "boolean") payload.marketing_push_enabled = input.marketingPushEnabled;
  if (typeof input.marketingEmailEnabled === "boolean") payload.marketing_email_enabled = input.marketingEmailEnabled;
  if (typeof input.transactionalPushEnabled === "boolean") payload.transactional_push_enabled = input.transactionalPushEnabled;
  if (typeof input.transactionalEmailEnabled === "boolean") payload.transactional_email_enabled = input.transactionalEmailEnabled;
  if (typeof input.rafflePushEnabled === "boolean") payload.raffle_push_enabled = input.rafflePushEnabled;
  if (typeof input.raffleEmailEnabled === "boolean") payload.raffle_email_enabled = input.raffleEmailEnabled;
  if (typeof input.tripPushEnabled === "boolean") payload.trip_push_enabled = input.tripPushEnabled;
  if (typeof input.tripEmailEnabled === "boolean") payload.trip_email_enabled = input.tripEmailEnabled;
  if (typeof input.paymentPushEnabled === "boolean") payload.payment_push_enabled = input.paymentPushEnabled;
  if (typeof input.paymentEmailEnabled === "boolean") payload.payment_email_enabled = input.paymentEmailEnabled;

  const upsert = await supabase
    .from("app_user_notification_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single<Record<string, unknown>>();

  if (upsert.error) {
    throw new Error(`No se pudieron guardar preferencias de notificación: ${upsert.error.message}`);
  }

  return toPreferences(userId, upsert.data);
}

export async function listUserNotificationsService(userId: string, input: ListUserNotificationsInput = {}) {
  if (!hasSupabaseConfig()) {
    return {
      notifications: [] as NotificationListItem[],
      unreadCount: 0
    };
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_notifications")
    .select("id,event_id,title,message,kind,link,is_read,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (input.unreadOnly) query = query.eq("is_read", false);
  if (input.kind) query = query.eq("kind", input.kind);
  if (input.limit) query = query.limit(input.limit);
  if (input.offset) query = query.range(input.offset, input.offset + (input.limit ?? 25) - 1);

  const list = await query.returns<Array<Record<string, unknown>>>();
  if (list.error) {
    if (isSchemaErrorMessage(list.error.message)) {
      return {
        notifications: [] as NotificationListItem[],
        unreadCount: 0
      };
    }
    throw new Error(`No se pudieron listar notificaciones: ${list.error.message}`);
  }

  const unread = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  const notifications = (list.data ?? []).map((row) => ({
    id: String(row.id),
    eventId: String(row.event_id),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    kind: String(row.kind ?? "system"),
    link: typeof row.link === "string" ? row.link : undefined,
    isRead: Boolean(row.is_read),
    readAt: typeof row.read_at === "string" ? row.read_at : undefined,
    createdAt: String(row.created_at ?? "")
  })) satisfies NotificationListItem[];

  return {
    notifications,
    unreadCount: unread.count ?? 0
  };
}

export async function markNotificationReadService(userId: string, notificationId: string, read = true) {
  if (!hasSupabaseConfig()) return { ok: true };
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_notifications")
    .update({
      is_read: read,
      read_at: read ? new Date().toISOString() : null
    })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (result.error) {
    throw new Error(`No se pudo actualizar notificación: ${result.error.message}`);
  }

  return { ok: Boolean(result.data?.id) };
}

export async function markAllNotificationsReadService(userId: string) {
  if (!hasSupabaseConfig()) return { ok: true };
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (result.error) {
    throw new Error(`No se pudieron marcar notificaciones: ${result.error.message}`);
  }

  return { ok: true };
}

export async function getUnreadNotificationCountService(userId: string) {
  if (!hasSupabaseConfig()) return 0;
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (result.error) {
    if (isSchemaErrorMessage(result.error.message)) return 0;
    throw new Error(`No se pudo cargar badge de notificaciones: ${result.error.message}`);
  }

  return result.count ?? 0;
}

export async function listAdminNotificationEventsService(input: ListAdminNotificationInput = {}) {
  if (!hasSupabaseConfig()) return [] as NotificationEventItem[];

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (input.eventType) query = query.eq("event_type", input.eventType);
  if (input.from) query = query.gte("created_at", input.from);
  if (input.to) query = query.lte("created_at", input.to);

  const rows = await query.returns<Array<Record<string, unknown>>>();
  if (rows.error) {
    if (isSchemaErrorMessage(rows.error.message)) return [];
    throw new Error(`No se pudieron listar eventos de notificación: ${rows.error.message}`);
  }

  return (rows.data ?? []).map((row) => ({
    id: String(row.id),
    eventType: String(row.event_type),
    entityType: typeof row.entity_type === "string" ? row.entity_type : undefined,
    entityId: typeof row.entity_id === "string" ? row.entity_id : undefined,
    actorUserId: typeof row.actor_user_id === "string" ? row.actor_user_id : undefined,
    recipientScope: (typeof row.recipient_scope === "string" ? row.recipient_scope : "targeted") as NotificationRecipientScope,
    dedupeKey: typeof row.dedupe_key === "string" ? row.dedupe_key : undefined,
    payload: (typeof row.payload === "object" && row.payload !== null ? row.payload : {}) as Record<string, unknown>,
    metadata: (typeof row.metadata_json === "object" && row.metadata_json !== null ? row.metadata_json : {}) as Record<string, unknown>,
    createdAt: String(row.created_at ?? "")
  })) satisfies NotificationEventItem[];
}

export async function listAdminNotificationDeliveriesService(input: ListAdminNotificationInput = {}) {
  if (!hasSupabaseConfig()) return [] as NotificationDeliveryItem[];

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_notification_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 250);

  if (input.channel) query = query.eq("channel", input.channel);
  if (input.status) query = query.eq("status", input.status);
  if (input.userId) query = query.eq("user_id", input.userId);
  if (input.from) query = query.gte("created_at", input.from);
  if (input.to) query = query.lte("created_at", input.to);

  const rows = await query.returns<Array<Record<string, unknown>>>();
  if (rows.error) {
    if (isSchemaErrorMessage(rows.error.message)) return [];
    throw new Error(`No se pudieron listar deliveries: ${rows.error.message}`);
  }

  return (rows.data ?? []).map((row) => ({
    id: String(row.id),
    eventId: String(row.event_id),
    notificationId: typeof row.notification_id === "string" ? row.notification_id : undefined,
    userId: typeof row.user_id === "string" ? row.user_id : undefined,
    channel: String(row.channel) as NotificationDeliveryItem["channel"],
    provider: typeof row.provider === "string" ? row.provider : undefined,
    destination: typeof row.destination === "string" ? row.destination : undefined,
    status: String(row.status) as NotificationDeliveryItem["status"],
    error: typeof row.error === "string" ? row.error : undefined,
    attemptedAt: typeof row.attempted_at === "string" ? row.attempted_at : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  })) satisfies NotificationDeliveryItem[];
}

export async function getAdminNotificationDashboardService(input: ListAdminNotificationInput = {}) {
  const [events, deliveries] = await Promise.all([
    listAdminNotificationEventsService(input),
    listAdminNotificationDeliveriesService(input)
  ]);

  const metrics = {
    totalEvents: events.length,
    totalDeliveries: deliveries.length,
    sent: deliveries.filter((item) => item.status === "sent").length,
    delivered: deliveries.filter((item) => item.status === "delivered").length,
    failed: deliveries.filter((item) => item.status === "failed").length,
    pending: deliveries.filter((item) => item.status === "pending").length,
    skipped: deliveries.filter((item) => item.status === "skipped").length
  };

  return { metrics, events, deliveries };
}

export async function retryNotificationDeliveryService(deliveryId: string, actorUserId?: string) {
  if (!hasSupabaseConfig()) return { ok: false, message: "Supabase no configurado" };
  const supabase = getSupabaseAdminClient();

  const row = await supabase
    .from("app_notification_deliveries")
    .select("*")
    .eq("id", deliveryId)
    .maybeSingle<Record<string, unknown>>();

  if (row.error) {
    throw new Error(`No se pudo cargar delivery: ${row.error.message}`);
  }
  if (!row.data) {
    return { ok: false, message: "Delivery no encontrado" };
  }

  const requestPayload = (typeof row.data.request_payload === "object" && row.data.request_payload !== null
    ? row.data.request_payload
    : {}) as Record<string, unknown>;
  const channel = String(row.data.channel ?? "") as "push" | "email" | "inbox";
  const now = new Date().toISOString();

  let status: "sent" | "delivered" | "failed" | "skipped" = "failed";
  let provider = typeof row.data.provider === "string" ? row.data.provider : null;
  let providerResponse: Record<string, unknown> = {};
  let error: string | null = null;

  if (channel === "inbox") {
    status = "delivered";
    provider = "internal";
    providerResponse = { retried: true };
  } else if (channel === "push") {
    const recipient = (typeof requestPayload.recipient === "object" && requestPayload.recipient !== null
      ? requestPayload.recipient
      : {}) as Record<string, unknown>;
    const externalId = typeof recipient.userId === "string" ? recipient.userId : "";

    if (!externalId) {
      status = "skipped";
      error = "missing_user_id";
      providerResponse = { reason: "missing_user_id" };
    } else {
      const pushed = await sendPushNotification({
        externalId,
        title: String(requestPayload.title ?? "Notificación"),
        message: String(requestPayload.message ?? ""),
        link: typeof requestPayload.link === "string" ? requestPayload.link : undefined,
        data: {
          retried: true,
          actorUserId: actorUserId ?? null
        }
      });
      status = pushed.ok ? "sent" : "failed";
      provider = pushed.provider;
      providerResponse = pushed.response;
      error = pushed.error ?? null;
    }
  } else {
    const recipient = (typeof requestPayload.recipient === "object" && requestPayload.recipient !== null
      ? requestPayload.recipient
      : {}) as Record<string, unknown>;
    const email = typeof recipient.email === "string" ? recipient.email : "";
    const emailPayload = (typeof requestPayload.email === "object" && requestPayload.email !== null
      ? requestPayload.email
      : {}) as Record<string, unknown>;

    if (!email) {
      status = "skipped";
      error = "missing_email";
      providerResponse = { reason: "missing_email" };
    } else {
      const sent = await sendTransactionalEmail({
        to: email,
        subject: String(emailPayload.subject ?? requestPayload.title ?? "Notificación"),
        html: String(emailPayload.html ?? ""),
        text: String(emailPayload.text ?? requestPayload.message ?? "")
      });
      status = sent.ok ? "sent" : "failed";
      provider = sent.provider;
      providerResponse = sent.response;
      error = sent.error ?? null;
    }
  }

  const attemptCount = Number(row.data.attempt_count ?? 1) + 1;
  const update = await supabase
    .from("app_notification_deliveries")
    .update({
      status,
      provider: provider ?? null,
      provider_response: providerResponse,
      error,
      attempted_at: now,
      attempt_count: attemptCount
    })
    .eq("id", deliveryId);

  if (update.error) {
    throw new Error(`No se pudo actualizar retry: ${update.error.message}`);
  }

  return {
    ok: status === "sent" || status === "delivered",
    status
  };
}

export async function sendManualAdminNotificationService(input: {
  actorUserId?: string;
  mode: "broadcast" | "targeted";
  title: string;
  message: string;
  link?: string;
  audience?: "marketing" | "transactional";
  channels?: Array<"push" | "email" | "inbox">;
  userIds?: string[];
  emails?: string[];
}) {
  const result = await dispatchNotificationEvent({
    eventType: input.mode === "broadcast" ? "MANUAL_ADMIN_BROADCAST" : "MANUAL_ADMIN_TARGETED",
    entityType: "admin_notification",
    entityId: undefined,
    actorUserId: input.actorUserId,
    recipients: input.mode === "broadcast"
      ? { scope: "broadcast", audience: "all" }
      : { scope: "mixed", userIds: input.userIds ?? [], emails: input.emails ?? [] },
    channels: input.channels,
    variables: {
      title: input.title,
      message: input.message,
      audience: input.audience ?? "marketing"
    },
    link: input.link,
    metadata: {
      source: "admin_manual"
    },
    dedupeKey: `manual:${input.mode}:${input.title.trim().toLowerCase()}:${input.message.trim().toLowerCase()}:${new Date().toISOString().slice(0, 16)}`
  });

  return result;
}
