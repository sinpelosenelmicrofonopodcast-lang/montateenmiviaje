"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { NotificationListItem, UserNotificationPreferences } from "@/lib/notifications/types";

interface PortalNotificationsManagerProps {
  initialNotifications: NotificationListItem[];
  initialUnreadCount: number;
  initialPreferences: UserNotificationPreferences;
}

type NotificationKindFilter = "all" | "raffle" | "trip" | "booking" | "payment" | "admin" | "system";

function buildNotificationsQuery(params: { kind: NotificationKindFilter; unreadOnly: boolean }) {
  const query = new URLSearchParams();
  query.set("limit", "100");
  if (params.kind !== "all") {
    query.set("kind", params.kind);
  }
  if (params.unreadOnly) {
    query.set("unreadOnly", "true");
  }
  return query.toString();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getKindLabel(kind: string) {
  if (kind === "raffle") return "Sorteos";
  if (kind === "trip") return "Viajes";
  if (kind === "booking") return "Reservas";
  if (kind === "payment") return "Pagos";
  if (kind === "admin") return "Admin";
  return "General";
}

export function PortalNotificationsManager({
  initialNotifications,
  initialUnreadCount,
  initialPreferences
}: PortalNotificationsManagerProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [kind, setKind] = useState<NotificationKindFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<"unknown" | "enabled" | "disabled">("unknown");
  const [requestingPush, setRequestingPush] = useState(false);

  const activeUnread = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/portal/notifications?${buildNotificationsQuery({ kind, unreadOnly })}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        message?: string;
        notifications?: NotificationListItem[];
        unreadCount?: number;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron cargar notificaciones");
      }

      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [kind, unreadOnly]);

  async function updateNotificationRead(notificationId: string, read: boolean) {
    setError(null);
    try {
      const response = await fetch(`/api/portal/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read })
      });
      const payload = (await response.json()) as { message?: string; ok?: boolean };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo actualizar notificación");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, isRead: read, readAt: read ? new Date().toISOString() : undefined }
            : item
        )
      );
      setUnreadCount((current) => (read ? Math.max(current - 1, 0) : current + 1));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado");
    }
  }

  async function markAllAsRead() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron marcar notificaciones");
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
      setMessage("Todas las notificaciones fueron marcadas como leídas.");
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences(next: Partial<UserNotificationPreferences>) {
    setSavingPreferences(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/portal/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      const payload = (await response.json()) as { message?: string; preferences?: UserNotificationPreferences };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron guardar preferencias");
      }
      if (payload.preferences) {
        setPreferences(payload.preferences);
      }
      setMessage("Preferencias de notificaciones actualizadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setSavingPreferences(false);
    }
  }

  async function withOneSignal<T>(callback: (oneSignal: Record<string, unknown>) => Promise<T> | T) {
    if (typeof window === "undefined") {
      return null;
    }

    const scopedWindow = window as Window & {
      OneSignalDeferred?: Array<(oneSignal: Record<string, unknown>) => void>;
    };

    return new Promise<T | null>((resolve) => {
      scopedWindow.OneSignalDeferred = scopedWindow.OneSignalDeferred || [];
      scopedWindow.OneSignalDeferred.push(async (oneSignal) => {
        try {
          const value = await callback(oneSignal);
          resolve(value);
        } catch {
          resolve(null);
        }
      });
    });
  }

  async function detectPushState() {
    const state = await withOneSignal(async (oneSignal) => {
      const notificationsApi = oneSignal.Notifications as
        | { permission?: boolean; getPermission?: () => Promise<boolean> | boolean }
        | undefined;
      const pushSub = (oneSignal as Record<string, unknown>).User as
        | { PushSubscription?: { optedIn?: boolean } }
        | undefined;

      const staticPermission = notificationsApi?.permission;
      const dynamicPermission =
        typeof notificationsApi?.getPermission === "function"
          ? await notificationsApi.getPermission()
          : staticPermission;
      const optedIn = pushSub?.PushSubscription?.optedIn;

      if (typeof optedIn === "boolean") {
        return optedIn ? "enabled" : "disabled";
      }
      if (typeof dynamicPermission === "boolean") {
        return dynamicPermission ? "enabled" : "disabled";
      }
      return "unknown";
    });

    setPushState(state === "enabled" || state === "disabled" ? state : "unknown");
  }

  async function requestPushPermission() {
    setRequestingPush(true);
    setError(null);
    setMessage(null);
    try {
      await withOneSignal(async (oneSignal) => {
        const notificationsApi = oneSignal.Notifications as
          | { requestPermission?: () => Promise<void>; canRequestPermission?: boolean }
          | undefined;
        if (notificationsApi && typeof notificationsApi.requestPermission === "function") {
          await notificationsApi.requestPermission();
        }
      });
      await detectPushState();
      setMessage("Solicitud de permisos de push ejecutada. Revisa la confirmación del navegador.");
    } catch (permissionError) {
      setError(permissionError instanceof Error ? permissionError.message : "No se pudo solicitar permiso push");
    } finally {
      setRequestingPush(false);
    }
  }

  return (
    <div className="stack-grid">
      <section className="card">
        <div className="table-head-row">
          <div>
            <h3>Centro de notificaciones</h3>
            <p className="muted">No leídas: {unreadCount}</p>
          </div>
          <div className="button-row" style={{ marginTop: 0 }}>
            <button className="button-outline" type="button" onClick={refreshNotifications} disabled={loading}>
              {loading ? "Cargando..." : "Actualizar"}
            </button>
            <button className="button-dark" type="button" onClick={markAllAsRead} disabled={loading || activeUnread === 0}>
              Marcar todas leídas
            </button>
          </div>
        </div>

        <div className="request-grid" style={{ marginTop: "12px" }}>
          <label>
            Tipo
            <select value={kind} onChange={(event) => setKind(event.target.value as NotificationKindFilter)}>
              <option value="all">Todas</option>
              <option value="raffle">Sorteos</option>
              <option value="trip">Viajes</option>
              <option value="booking">Reservas</option>
              <option value="payment">Pagos</option>
              <option value="admin">Admin</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <label>
            Estado
            <select
              value={unreadOnly ? "unread" : "all"}
              onChange={(event) => setUnreadOnly(event.target.value === "unread")}
            >
              <option value="all">Todas</option>
              <option value="unread">Solo no leídas</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h3>Preferencias de notificación</h3>
        <p className="muted">Controla qué mensajes recibes por push y email.</p>

        <div className="request-grid">
          <label>
            Push general
            <select
              value={preferences.pushEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ pushEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Email general
            <select
              value={preferences.emailEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ emailEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Push de sorteos
            <select
              value={preferences.rafflePushEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ rafflePushEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Email de sorteos
            <select
              value={preferences.raffleEmailEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ raffleEmailEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Push de viajes/reservas
            <select
              value={preferences.tripPushEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ tripPushEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Email de viajes/reservas
            <select
              value={preferences.tripEmailEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ tripEmailEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Push de pagos
            <select
              value={preferences.paymentPushEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ paymentPushEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
          <label>
            Email de pagos
            <select
              value={preferences.paymentEmailEnabled ? "on" : "off"}
              onChange={(event) => savePreferences({ paymentEmailEnabled: event.target.value === "on" })}
              disabled={savingPreferences}
            >
              <option value="on">Activado</option>
              <option value="off">Desactivado</option>
            </select>
          </label>
        </div>

        <div className="button-row">
          <button className="button-outline" type="button" onClick={detectPushState}>
            Ver estado push
          </button>
          <button className="button-dark" type="button" onClick={requestPushPermission} disabled={requestingPush}>
            {requestingPush ? "Solicitando..." : "Activar notificaciones push"}
          </button>
        </div>
        <p className="muted">
          Estado push:{" "}
          <strong>
            {pushState === "enabled" ? "activo" : pushState === "disabled" ? "desactivado" : "sin confirmar"}
          </strong>
        </p>
      </section>

      <section className="card">
        <h3>Historial</h3>
        {notifications.length === 0 ? (
          <p className="muted">No tienes notificaciones para este filtro.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>
                      <strong>{notification.title}</strong>
                      <p className="muted" style={{ margin: "6px 0 0" }}>{notification.message}</p>
                    </td>
                    <td>{getKindLabel(notification.kind)}</td>
                    <td>{formatDate(notification.createdAt)}</td>
                    <td>{notification.isRead ? "Leída" : "No leída"}</td>
                    <td>
                      <div className="button-row" style={{ marginTop: 0 }}>
                        {notification.link ? (
                          <Link className="button-outline" href={notification.link}>
                            Abrir
                          </Link>
                        ) : null}
                        <button
                          className="button-outline"
                          type="button"
                          onClick={() => updateNotificationRead(notification.id, !notification.isRead)}
                        >
                          {notification.isRead ? "Marcar no leída" : "Marcar leída"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
