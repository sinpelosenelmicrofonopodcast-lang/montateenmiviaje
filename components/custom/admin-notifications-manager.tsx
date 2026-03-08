"use client";

import { useMemo, useState } from "react";
import {
  NotificationDeliveryItem,
  NotificationEventItem
} from "@/lib/notifications/types";

interface AdminNotificationsManagerProps {
  initialMetrics: {
    totalEvents: number;
    totalDeliveries: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    skipped: number;
  };
  initialEvents: NotificationEventItem[];
  initialDeliveries: NotificationDeliveryItem[];
}

function formatDate(value: string | undefined) {
  if (!value) return "-";
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

function parseCommaSeparated(value: string) {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminNotificationsManager({
  initialMetrics,
  initialEvents,
  initialDeliveries
}: AdminNotificationsManagerProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [events, setEvents] = useState(initialEvents);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    eventType: "",
    channel: "",
    status: ""
  });

  const [manualForm, setManualForm] = useState({
    mode: "broadcast" as "broadcast" | "targeted",
    title: "",
    message: "",
    link: "",
    audience: "marketing" as "marketing" | "transactional",
    channels: {
      push: true,
      email: true,
      inbox: true
    },
    userIds: "",
    emails: ""
  });

  const selectedChannels = useMemo(
    () =>
      (["push", "email", "inbox"] as const).filter((channel) => manualForm.channels[channel]),
    [manualForm.channels]
  );

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("limit", "200");
      if (filters.eventType.trim()) query.set("eventType", filters.eventType.trim());
      if (filters.channel.trim()) query.set("channel", filters.channel.trim());
      if (filters.status.trim()) query.set("status", filters.status.trim());

      const response = await fetch(`/api/admin/notifications?${query.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        message?: string;
        metrics?: typeof initialMetrics;
        events?: NotificationEventItem[];
        deliveries?: NotificationDeliveryItem[];
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cargar dashboard de notificaciones");
      }

      setMetrics(payload.metrics ?? initialMetrics);
      setEvents(payload.events ?? []);
      setDeliveries(payload.deliveries ?? []);
    } catch (reloadError) {
      setError(reloadError instanceof Error ? reloadError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function sendManualNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: manualForm.mode,
          title: manualForm.title.trim(),
          message: manualForm.message.trim(),
          link: manualForm.link.trim() || undefined,
          audience: manualForm.audience,
          channels: selectedChannels,
          userIds: manualForm.mode === "targeted" ? parseCommaSeparated(manualForm.userIds) : undefined,
          emails: manualForm.mode === "targeted" ? parseCommaSeparated(manualForm.emails) : undefined
        })
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo enviar notificación");
      }

      setManualForm((current) => ({ ...current, title: "", message: "", link: "", userIds: "", emails: "" }));
      setMessage("Notificación enviada correctamente.");
      await reload();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function retryDelivery(deliveryId: string) {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/notifications/deliveries/${deliveryId}/retry`, {
        method: "POST"
      });
      const payload = (await response.json()) as { message?: string; ok?: boolean; status?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo reintentar delivery");
      }
      setMessage(payload.ok ? "Delivery reintentado correctamente." : `Reintento completado con estado ${payload.status ?? "unknown"}.`);
      await reload();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Error inesperado");
    }
  }

  return (
    <div className="stack-grid">
      <section className="kpi-grid">
        <article className="admin-card"><p className="kpi-title">Eventos</p><h3 className="kpi-value">{metrics.totalEvents}</h3></article>
        <article className="admin-card"><p className="kpi-title">Deliveries</p><h3 className="kpi-value">{metrics.totalDeliveries}</h3></article>
        <article className="admin-card"><p className="kpi-title">Enviados</p><h3 className="kpi-value">{metrics.sent}</h3></article>
        <article className="admin-card"><p className="kpi-title">Entregados</p><h3 className="kpi-value">{metrics.delivered}</h3></article>
        <article className="admin-card"><p className="kpi-title">Fallidos</p><h3 className="kpi-value">{metrics.failed}</h3></article>
        <article className="admin-card"><p className="kpi-title">Pendientes</p><h3 className="kpi-value">{metrics.pending}</h3></article>
      </section>

      <section className="card request-grid">
        <h3 className="request-full">Filtros</h3>
        <label>
          Event type
          <input
            value={filters.eventType}
            onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}
            placeholder="RAFFLE_PUBLISHED"
          />
        </label>
        <label>
          Canal
          <select
            value={filters.channel}
            onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))}
          >
            <option value="">Todos</option>
            <option value="push">Push</option>
            <option value="email">Email</option>
            <option value="inbox">Inbox</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Todos</option>
            <option value="pending">pending</option>
            <option value="sent">sent</option>
            <option value="delivered">delivered</option>
            <option value="failed">failed</option>
            <option value="skipped">skipped</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="button" onClick={reload} disabled={loading}>
            {loading ? "Actualizando..." : "Aplicar filtros"}
          </button>
        </div>
      </section>

      <form className="card request-grid" onSubmit={sendManualNotification}>
        <h3 className="request-full">Envío manual</h3>
        <label>
          Modo
          <select
            value={manualForm.mode}
            onChange={(event) =>
              setManualForm((current) => ({ ...current, mode: event.target.value as "broadcast" | "targeted" }))
            }
          >
            <option value="broadcast">Broadcast</option>
            <option value="targeted">Targeted</option>
          </select>
        </label>
        <label>
          Audiencia
          <select
            value={manualForm.audience}
            onChange={(event) =>
              setManualForm((current) => ({ ...current, audience: event.target.value as "marketing" | "transactional" }))
            }
          >
            <option value="marketing">Marketing</option>
            <option value="transactional">Transaccional</option>
          </select>
        </label>
        <label className="request-full">
          Título
          <input
            value={manualForm.title}
            onChange={(event) => setManualForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>
        <label className="request-full">
          Mensaje
          <textarea
            rows={3}
            value={manualForm.message}
            onChange={(event) => setManualForm((current) => ({ ...current, message: event.target.value }))}
            required
          />
        </label>
        <label className="request-full">
          Link (opcional)
          <input
            value={manualForm.link}
            onChange={(event) => setManualForm((current) => ({ ...current, link: event.target.value }))}
            placeholder="/sorteos"
          />
        </label>

        <label>
          Canal push
          <select
            value={manualForm.channels.push ? "on" : "off"}
            onChange={(event) =>
              setManualForm((current) => ({
                ...current,
                channels: { ...current.channels, push: event.target.value === "on" }
              }))
            }
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label>
          Canal email
          <select
            value={manualForm.channels.email ? "on" : "off"}
            onChange={(event) =>
              setManualForm((current) => ({
                ...current,
                channels: { ...current.channels, email: event.target.value === "on" }
              }))
            }
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label>
          Canal inbox
          <select
            value={manualForm.channels.inbox ? "on" : "off"}
            onChange={(event) =>
              setManualForm((current) => ({
                ...current,
                channels: { ...current.channels, inbox: event.target.value === "on" }
              }))
            }
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>

        {manualForm.mode === "targeted" ? (
          <>
            <label className="request-full">
              User IDs (coma o salto de línea)
              <textarea
                rows={2}
                value={manualForm.userIds}
                onChange={(event) => setManualForm((current) => ({ ...current, userIds: event.target.value }))}
                placeholder="uuid, uuid"
              />
            </label>
            <label className="request-full">
              Emails (coma o salto de línea)
              <textarea
                rows={2}
                value={manualForm.emails}
                onChange={(event) => setManualForm((current) => ({ ...current, emails: event.target.value }))}
                placeholder="user@email.com, user2@email.com"
              />
            </label>
          </>
        ) : null}

        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading || selectedChannels.length === 0}>
            {loading ? "Enviando..." : "Enviar notificación"}
          </button>
        </div>
      </form>

      <section className="card">
        <h3>Eventos</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Scope</th>
                <th>Entidad</th>
                <th>Dedupe</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={5}>Sin eventos</td></tr>
              ) : (
                events.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{item.eventType}</td>
                    <td>{item.recipientScope}</td>
                    <td>{item.entityType ? `${item.entityType}:${item.entityId ?? "-"}` : "-"}</td>
                    <td>{item.dedupeKey ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Deliveries</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Canal</th>
                <th>Status</th>
                <th>Destino</th>
                <th>Error</th>
                <th>Retry</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={6}>Sin deliveries</td></tr>
              ) : (
                deliveries.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{item.channel}</td>
                    <td>{item.status}</td>
                    <td>{item.destination ?? "-"}</td>
                    <td>{item.error ?? "-"}</td>
                    <td>
                      <button
                        className="button-outline"
                        type="button"
                        disabled={item.channel === "inbox"}
                        onClick={() => retryDelivery(item.id)}
                      >
                        Reintentar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
