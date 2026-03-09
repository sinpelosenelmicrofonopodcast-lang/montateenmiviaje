import "server-only";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { sendTransactionalEmail } from "@/lib/notifications/channels/email-channel";
import { sendPushNotification } from "@/lib/notifications/channels/push-channel";
import { resolveNotificationTemplate } from "@/lib/notifications/templates";
import {
  DispatchNotificationInput,
  DispatchNotificationResult,
  NotificationChannel,
  NotificationEventType,
  NotificationRecipient,
  NotificationRecipientScope,
  UserNotificationPreferences
} from "@/lib/notifications/types";

interface AppProfileRow {
  id: string;
  email: string | null;
  role?: string | null;
  account_status?: string | null;
  full_name?: string | null;
}

interface AppNotificationPreferenceRow {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  marketing_push_enabled: boolean;
  marketing_email_enabled: boolean;
  transactional_push_enabled: boolean;
  transactional_email_enabled: boolean;
  raffle_push_enabled: boolean;
  raffle_email_enabled: boolean;
  trip_push_enabled: boolean;
  trip_email_enabled: boolean;
  payment_push_enabled: boolean;
  payment_email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isSchemaErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist")
    || normalized.includes("could not find the table")
    || normalized.includes("column")
    || normalized.includes("schema cache")
  );
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  pushEnabled: true,
  emailEnabled: true,
  marketingPushEnabled: true,
  marketingEmailEnabled: true,
  transactionalPushEnabled: true,
  transactionalEmailEnabled: true,
  rafflePushEnabled: true,
  raffleEmailEnabled: true,
  tripPushEnabled: true,
  tripEmailEnabled: true,
  paymentPushEnabled: true,
  paymentEmailEnabled: true
} satisfies Omit<UserNotificationPreferences, "userId" | "createdAt" | "updatedAt">;

function toPreferenceRow(userId: string, row?: AppNotificationPreferenceRow | null): UserNotificationPreferences {
  return {
    userId,
    pushEnabled: row?.push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.pushEnabled,
    emailEnabled: row?.email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
    marketingPushEnabled: row?.marketing_push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.marketingPushEnabled,
    marketingEmailEnabled: row?.marketing_email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.marketingEmailEnabled,
    transactionalPushEnabled: row?.transactional_push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.transactionalPushEnabled,
    transactionalEmailEnabled: row?.transactional_email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.transactionalEmailEnabled,
    rafflePushEnabled: row?.raffle_push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.rafflePushEnabled,
    raffleEmailEnabled: row?.raffle_email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.raffleEmailEnabled,
    tripPushEnabled: row?.trip_push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.tripPushEnabled,
    tripEmailEnabled: row?.trip_email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.tripEmailEnabled,
    paymentPushEnabled: row?.payment_push_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.paymentPushEnabled,
    paymentEmailEnabled: row?.payment_email_enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.paymentEmailEnabled,
    createdAt: row?.created_at,
    updatedAt: row?.updated_at
  };
}

async function mapEmailsToProfiles(emails: string[]) {
  if (!emails.length) return [] as NotificationRecipient[];
  const supabase = getSupabaseAdminClient();
  const normalized = [...new Set(emails.map(normalizeEmail))];

  const profiles = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .in("email", normalized)
    .returns<Array<{ id: string; email: string | null; full_name: string | null }>>();

  if (profiles.error && !isSchemaErrorMessage(profiles.error.message)) {
    throw new Error(`No se pudo resolver perfiles por email: ${profiles.error.message}`);
  }

  const byEmail = new Map((profiles.data ?? []).map((row) => [normalizeEmail(row.email ?? ""), row]));
  return normalized.map((email) => {
    const found = byEmail.get(email);
    return {
      userId: found?.id,
      email,
      fullName: found?.full_name ?? undefined
    } satisfies NotificationRecipient;
  });
}

async function resolveRecipients(input: DispatchNotificationInput): Promise<NotificationRecipient[]> {
  const supabase = getSupabaseAdminClient();
  const source = input.recipients;

  if (source.scope === "broadcast") {
    const query = await supabase
      .from("profiles")
      .select("id,email,role,account_status,full_name")
      .returns<AppProfileRow[]>();

    if (query.error) {
      if (isSchemaErrorMessage(query.error.message)) {
        const fallback = await supabase.from("profiles").select("id,email").returns<Array<{ id: string; email: string | null }>>();
        if (fallback.error) {
          throw new Error(`No se pudo resolver broadcast de perfiles: ${fallback.error.message}`);
        }
        return (fallback.data ?? [])
          .filter((row) => Boolean(row.email))
          .map((row) => ({ userId: row.id, email: row.email ?? undefined }));
      }

      throw new Error(`No se pudo resolver broadcast de perfiles: ${query.error.message}`);
    }

    return (query.data ?? [])
      .filter((row) => {
        if (!row.email) return false;
        if (source.audience === "users") {
          const role = (row.role ?? "user").toLowerCase();
          if (["owner", "super_admin", "admin", "manager", "moderator", "travel_agent"].includes(role)) {
            return false;
          }
        }
        if (row.account_status && row.account_status.toLowerCase() === "archived") {
          return false;
        }
        return true;
      })
      .map((row) => ({
        userId: row.id,
        email: row.email ?? undefined,
        fullName: row.full_name ?? undefined
      }));
  }

  if (source.scope === "user_ids") {
    const userIds = [...new Set(source.userIds.filter(Boolean))];
    if (!userIds.length) return [];

    const profiles = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", userIds)
      .returns<Array<{ id: string; email: string | null; full_name: string | null }>>();

    if (profiles.error && !isSchemaErrorMessage(profiles.error.message)) {
      throw new Error(`No se pudo resolver destinatarios por user_id: ${profiles.error.message}`);
    }

    const map = new Map((profiles.data ?? []).map((item) => [item.id, item]));
    return userIds.map((userId) => {
      const profile = map.get(userId);
      return {
        userId,
        email: profile?.email ?? undefined,
        fullName: profile?.full_name ?? undefined
      } satisfies NotificationRecipient;
    });
  }

  if (source.scope === "emails") {
    return mapEmailsToProfiles(source.emails);
  }

  if (source.scope === "booking_id") {
    const booking = await supabase
      .from("app_bookings")
      .select("customer_email")
      .eq("id", source.bookingId)
      .maybeSingle<{ customer_email: string }>();

    if (booking.error) {
      throw new Error(`No se pudo resolver booking para notificación: ${booking.error.message}`);
    }

    if (!booking.data?.customer_email) return [];
    return mapEmailsToProfiles([booking.data.customer_email]);
  }

  if (source.scope === "raffle_entry_id") {
    const entry = await supabase
      .from("app_raffle_entries")
      .select("customer_email")
      .eq("id", source.entryId)
      .maybeSingle<{ customer_email: string }>();

    if (entry.error) {
      throw new Error(`No se pudo resolver entrada de rifa: ${entry.error.message}`);
    }

    if (!entry.data?.customer_email) return [];
    return mapEmailsToProfiles([entry.data.customer_email]);
  }

  if (source.scope === "trip_slug") {
    const bookings = await supabase
      .from("app_bookings")
      .select("customer_email,status")
      .eq("trip_slug", source.tripSlug)
      .returns<Array<{ customer_email: string; status: string }>>();

    if (bookings.error) {
      throw new Error(`No se pudo resolver destinatarios por trip_slug: ${bookings.error.message}`);
    }

    const emails = [...new Set((bookings.data ?? [])
      .filter((row) => row.customer_email && row.status !== "cancelado")
      .map((row) => row.customer_email))];

    return mapEmailsToProfiles(emails);
  }

  const mixedEmails = source.scope === "mixed" ? source.emails ?? [] : [];
  const mixedUserIds = source.scope === "mixed" ? source.userIds ?? [] : [];

  const [byEmails, byIds] = await Promise.all([
    mixedEmails.length ? mapEmailsToProfiles(mixedEmails) : Promise.resolve([] as NotificationRecipient[]),
    mixedUserIds.length
      ? resolveRecipients({
          ...input,
          recipients: { scope: "user_ids", userIds: mixedUserIds }
        })
      : Promise.resolve([] as NotificationRecipient[])
  ]);

  return [...byEmails, ...byIds];
}

function mergeRecipients(recipients: NotificationRecipient[]) {
  const map = new Map<string, NotificationRecipient>();
  for (const item of recipients) {
    const key = item.userId ? `u:${item.userId}` : item.email ? `e:${normalizeEmail(item.email)}` : "";
    if (!key) continue;
    const prev = map.get(key);
    map.set(key, {
      userId: item.userId ?? prev?.userId,
      email: item.email ?? prev?.email,
      fullName: item.fullName ?? prev?.fullName
    });
  }
  return [...map.values()];
}

function resolveScope(source: DispatchNotificationInput["recipients"]): NotificationRecipientScope {
  if (source.scope === "broadcast") return "broadcast";
  if (source.scope === "mixed") return "mixed";
  return "targeted";
}

async function loadPreferencesByUserIds(userIds: string[]) {
  const map = new Map<string, UserNotificationPreferences>();
  if (!userIds.length) return map;

  const supabase = getSupabaseAdminClient();
  const rows = await supabase
    .from("app_user_notification_preferences")
    .select("*")
    .in("user_id", userIds)
    .returns<AppNotificationPreferenceRow[]>();

  if (rows.error && !isSchemaErrorMessage(rows.error.message)) {
    throw new Error(`No se pudieron cargar preferencias de notificación: ${rows.error.message}`);
  }

  for (const userId of userIds) {
    const row = (rows.data ?? []).find((item) => item.user_id === userId);
    map.set(userId, toPreferenceRow(userId, row));
  }

  return map;
}

function isChannelAllowed(params: {
  channel: NotificationChannel;
  kind: string;
  audience: "marketing" | "transactional";
  preferences: UserNotificationPreferences;
}) {
  const { channel, kind, audience, preferences } = params;

  if (channel === "inbox") {
    return true;
  }

  if (channel === "push" && !preferences.pushEnabled) return false;
  if (channel === "email" && !preferences.emailEnabled) return false;

  if (audience === "marketing") {
    if (channel === "push" && !preferences.marketingPushEnabled) return false;
    if (channel === "email" && !preferences.marketingEmailEnabled) return false;
  } else {
    if (channel === "push" && !preferences.transactionalPushEnabled) return false;
    if (channel === "email" && !preferences.transactionalEmailEnabled) return false;
  }

  if (kind === "raffle") {
    if (channel === "push" && !preferences.rafflePushEnabled) return false;
    if (channel === "email" && !preferences.raffleEmailEnabled) return false;
  }
  if (kind === "trip" || kind === "booking") {
    if (channel === "push" && !preferences.tripPushEnabled) return false;
    if (channel === "email" && !preferences.tripEmailEnabled) return false;
  }
  if (kind === "payment") {
    if (channel === "push" && !preferences.paymentPushEnabled) return false;
    if (channel === "email" && !preferences.paymentEmailEnabled) return false;
  }

  return true;
}

function getDefaultChannels(eventType: NotificationEventType): NotificationChannel[] {
  if (eventType === "RAFFLE_PUBLISHED" || eventType === "TRIP_PUBLISHED" || eventType === "MANUAL_ADMIN_BROADCAST") {
    return ["push", "email", "inbox"];
  }
  return ["inbox", "push", "email"];
}

export async function dispatchNotificationEvent(input: DispatchNotificationInput): Promise<DispatchNotificationResult> {
  if (!hasSupabaseConfig()) {
    return {
      eventId: null,
      deduped: false,
      recipients: 0,
      deliveries: { sent: 0, delivered: 0, failed: 0, skipped: 0 }
    };
  }

  const supabase = getSupabaseAdminClient();
  const template = resolveNotificationTemplate(input.eventType, input.variables, input.link);
  const requestedChannels = input.channels?.length ? [...new Set(input.channels)] : getDefaultChannels(input.eventType);
  const recipients = mergeRecipients(await resolveRecipients(input));
  const now = new Date().toISOString();

  if (input.dedupeKey) {
    const existing = await supabase
      .from("app_notification_events")
      .select("id")
      .eq("dedupe_key", input.dedupeKey)
      .maybeSingle<{ id: string }>();

    if (!existing.error && existing.data?.id) {
      return {
        eventId: existing.data.id,
        deduped: true,
        recipients: recipients.length,
        deliveries: { sent: 0, delivered: 0, failed: 0, skipped: 0 }
      };
    }
  }

  const eventInsert = await supabase
    .from("app_notification_events")
    .insert({
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      actor_user_id: input.actorUserId ?? null,
      recipient_scope: resolveScope(input.recipients),
      dedupe_key: input.dedupeKey ?? null,
      payload: {
        ...input.variables,
        template: {
          title: template.title,
          message: template.message,
          link: template.link ?? null,
          kind: template.kind,
          audience: template.audience
        },
        channels: requestedChannels
      },
      metadata_json: input.metadata ?? {}
    })
    .select("id")
    .single<{ id: string }>();

  if (eventInsert.error || !eventInsert.data?.id) {
    if (eventInsert.error && isSchemaErrorMessage(eventInsert.error.message)) {
      return {
        eventId: null,
        deduped: false,
        recipients: recipients.length,
        deliveries: { sent: 0, delivered: 0, failed: 0, skipped: 0 }
      };
    }

    throw new Error(`No se pudo registrar evento de notificación: ${eventInsert.error?.message ?? "sin datos"}`);
  }

  const eventId = eventInsert.data.id;
  const userIds = [...new Set(recipients.map((item) => item.userId).filter((item): item is string => Boolean(item)))];
  const preferenceMap = await loadPreferencesByUserIds(userIds);

  let sent = 0;
  let delivered = 0;
  let failed = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const preferences = recipient.userId
      ? preferenceMap.get(recipient.userId) ?? toPreferenceRow(recipient.userId)
      : null;

    let notificationId: string | null = null;
    if (requestedChannels.includes("inbox") && recipient.userId) {
      const notificationInsert = await supabase
        .from("app_notifications")
        .insert({
          event_id: eventId,
          user_id: recipient.userId,
          title: template.title,
          message: template.message,
          link: template.link ?? null,
          kind: template.kind,
          channel_summary: {
            channels: requestedChannels,
            audience: template.audience,
            event_type: input.eventType
          }
        })
        .select("id")
        .single<{ id: string }>();

      if (!notificationInsert.error && notificationInsert.data?.id) {
        notificationId = notificationInsert.data.id;
      }
    }

    for (const channel of requestedChannels) {
      const requestPayload = {
        eventType: input.eventType,
        title: template.title,
        message: template.message,
        link: template.link ?? null,
        recipient,
        audience: template.audience,
        kind: template.kind
      } as Record<string, unknown>;

      if (channel === "inbox") {
        const status = notificationId ? "delivered" : "skipped";
        await supabase.from("app_notification_deliveries").insert({
          event_id: eventId,
          notification_id: notificationId,
          user_id: recipient.userId ?? null,
          channel: "inbox",
          provider: "internal",
          destination: recipient.userId ?? recipient.email ?? null,
          status,
          request_payload: requestPayload,
          provider_response: notificationId ? { notification_id: notificationId } : { reason: "missing_user" },
          attempted_at: now
        });
        if (status === "delivered") delivered += 1;
        else skipped += 1;
        continue;
      }

      if (recipient.userId && preferences && !isChannelAllowed({
        channel,
        kind: template.kind,
        audience: template.audience,
        preferences
      })) {
        await supabase.from("app_notification_deliveries").insert({
          event_id: eventId,
          notification_id: notificationId,
          user_id: recipient.userId,
          channel,
          provider: channel === "push" ? "onesignal" : "email",
          destination: channel === "push" ? recipient.userId : recipient.email ?? null,
          status: "skipped",
          request_payload: requestPayload,
          provider_response: { reason: "preference_disabled" },
          attempted_at: now
        });
        skipped += 1;
        continue;
      }

      if (channel === "push") {
        if (!recipient.userId) {
          await supabase.from("app_notification_deliveries").insert({
            event_id: eventId,
            notification_id: notificationId,
            user_id: null,
            channel: "push",
            provider: "onesignal",
            destination: null,
            status: "skipped",
            request_payload: requestPayload,
            provider_response: { reason: "missing_user_id" },
            attempted_at: now
          });
          skipped += 1;
          continue;
        }

        const pushResult = await sendPushNotification({
          externalId: recipient.userId,
          title: template.title,
          message: template.message,
          link: template.link,
          data: {
            eventType: input.eventType,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            notificationId
          }
        });

        await supabase.from("app_notification_deliveries").insert({
          event_id: eventId,
          notification_id: notificationId,
          user_id: recipient.userId,
          channel: "push",
          provider: pushResult.provider,
          destination: recipient.userId,
          status: pushResult.ok ? "sent" : "failed",
          request_payload: requestPayload,
          provider_response: pushResult.response,
          error: pushResult.error ?? null,
          attempted_at: now
        });

        if (pushResult.ok) sent += 1;
        else failed += 1;
        continue;
      }

      if (!recipient.email) {
        await supabase.from("app_notification_deliveries").insert({
          event_id: eventId,
          notification_id: notificationId,
          user_id: recipient.userId ?? null,
          channel: "email",
          provider: "email",
          destination: null,
          status: "skipped",
          request_payload: requestPayload,
          provider_response: { reason: "missing_email" },
          attempted_at: now
        });
        skipped += 1;
        continue;
      }

      const emailResult = await sendTransactionalEmail({
        to: recipient.email,
        subject: template.email.subject,
        html: template.email.html,
        text: template.email.text
      });

      await supabase.from("app_notification_deliveries").insert({
        event_id: eventId,
        notification_id: notificationId,
        user_id: recipient.userId ?? null,
        channel: "email",
        provider: emailResult.provider,
        destination: recipient.email,
        status: emailResult.ok ? "sent" : "failed",
        request_payload: {
          ...requestPayload,
          email: {
            subject: template.email.subject,
            html: template.email.html,
            text: template.email.text
          }
        },
        provider_response: emailResult.response,
        error: emailResult.error ?? null,
        attempted_at: now
      });

      if (emailResult.ok) sent += 1;
      else failed += 1;
    }
  }

  return {
    eventId,
    deduped: false,
    recipients: recipients.length,
    deliveries: { sent, delivered, failed, skipped }
  };
}

export async function dispatchNotificationEventSafe(input: DispatchNotificationInput) {
  try {
    return await dispatchNotificationEvent(input);
  } catch (error) {
    return {
      eventId: null,
      deduped: false,
      recipients: 0,
      deliveries: { sent: 0, delivered: 0, failed: 1, skipped: 0 },
      error: error instanceof Error ? error.message : "notification_error"
    };
  }
}
