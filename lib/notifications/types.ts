export type NotificationChannel = "push" | "email" | "inbox";

export type NotificationEventType =
  | "RAFFLE_PUBLISHED"
  | "TRIP_PUBLISHED"
  | "RAFFLE_ENTRY_CONFIRMED"
  | "TRIP_BOOKING_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "MANUAL_ADMIN_BROADCAST"
  | "MANUAL_ADMIN_TARGETED";

export type NotificationKind = "raffle" | "trip" | "booking" | "payment" | "admin" | "system";
export type NotificationAudience = "marketing" | "transactional";

export interface NotificationTemplateResult {
  title: string;
  message: string;
  link?: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  email: {
    subject: string;
    preheader: string;
    heading: string;
    body: string;
    ctaLabel?: string;
    ctaHref?: string;
    text: string;
    html: string;
  };
}

export type NotificationRecipientScope = "broadcast" | "targeted" | "mixed" | "system";

export type NotificationRecipientsInput =
  | { scope: "broadcast"; audience?: "all" | "users" }
  | { scope: "user_ids"; userIds: string[] }
  | { scope: "emails"; emails: string[] }
  | { scope: "booking_id"; bookingId: string }
  | { scope: "raffle_entry_id"; entryId: string }
  | { scope: "trip_slug"; tripSlug: string }
  | { scope: "mixed"; userIds?: string[]; emails?: string[] };

export interface DispatchNotificationInput {
  eventType: NotificationEventType;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  recipients: NotificationRecipientsInput;
  channels?: NotificationChannel[];
  variables?: Record<string, unknown>;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}

export interface DispatchNotificationResult {
  eventId: string | null;
  deduped: boolean;
  recipients: number;
  deliveries: {
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
  };
}

export interface NotificationRecipient {
  userId?: string;
  email?: string;
  fullName?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  marketingPushEnabled: boolean;
  marketingEmailEnabled: boolean;
  transactionalPushEnabled: boolean;
  transactionalEmailEnabled: boolean;
  rafflePushEnabled: boolean;
  raffleEmailEnabled: boolean;
  tripPushEnabled: boolean;
  tripEmailEnabled: boolean;
  paymentPushEnabled: boolean;
  paymentEmailEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationListItem {
  id: string;
  eventId: string;
  title: string;
  message: string;
  kind: NotificationKind | string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationDeliveryItem {
  id: string;
  eventId: string;
  notificationId?: string;
  userId?: string;
  channel: NotificationChannel;
  provider?: string;
  destination?: string;
  status: "pending" | "sent" | "delivered" | "failed" | "skipped";
  error?: string;
  attemptedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationEventItem {
  id: string;
  eventType: NotificationEventType | string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  recipientScope: NotificationRecipientScope;
  dedupeKey?: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}
