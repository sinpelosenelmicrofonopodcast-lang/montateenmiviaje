"use client";

import { useMemo, useState } from "react";
import { ReferralCode, ReferralEvent, ReferralReward } from "@/lib/types";

interface PortalReferralsManagerProps {
  initialCode: ReferralCode | null;
  initialEvents: ReferralEvent[];
  initialRewards: ReferralReward[];
}

export function PortalReferralsManager({ initialCode, initialEvents, initialRewards }: PortalReferralsManagerProps) {
  const [code, setCode] = useState(initialCode);
  const [events, setEvents] = useState(initialEvents);
  const [rewards, setRewards] = useState(initialRewards);
  const [applyCode, setApplyCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shareUrl = useMemo(() => {
    if (!code?.referralCode) {
      return "";
    }
    if (typeof window === "undefined") {
      return `/ref/${code.referralCode}`;
    }
    return `${window.location.origin}/ref/${code.referralCode}`;
  }, [code?.referralCode]);

  async function reload() {
    const response = await fetch("/api/portal/referrals", { cache: "no-store" });
    const payload = (await response.json()) as {
      message?: string;
      referralCode?: ReferralCode | null;
      events?: ReferralEvent[];
      rewards?: ReferralReward[];
    };

    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudo refrescar referidos");
    }

    setCode(payload.referralCode ?? null);
    setEvents(payload.events ?? []);
    setRewards(payload.rewards ?? []);
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Link copiado.");
  }

  async function handleApplyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/portal/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: applyCode.trim().toUpperCase() })
      });
      const payload = (await response.json()) as { message?: string; applied?: boolean };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo aplicar código");
      }

      setMessage(payload.applied ? "Código aplicado correctamente." : "Código no aplicado (valida que no sea tuyo o esté activo).");
      setApplyCode("");
      await reload();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-grid">
      <section className="card">
        <h3>Invita y gana</h3>
        {code ? (
          <>
            <p>
              Código: <strong>{code.referralCode}</strong>
            </p>
            <p className="muted">Clicks: {code.clicksCount} · Registros: {code.signupsCount} · Conversiones: {code.conversionsCount}</p>
            <p className="muted">Reward acumulado: USD {code.rewardPointsEarned.toFixed(2)}</p>
            <div className="button-row">
              <button className="button-dark" type="button" onClick={copyLink}>Copiar link</button>
              <a
                className="button-outline"
                href={`https://wa.me/?text=${encodeURIComponent(`Únete a Móntate en mi viaje con mi link: ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Compartir por WhatsApp
              </a>
            </div>
            {shareUrl ? <p className="muted">{shareUrl}</p> : null}
          </>
        ) : (
          <p className="muted">Tu código se genera automáticamente al completar la migración y perfil.</p>
        )}
      </section>

      <form className="card" onSubmit={handleApplyCode}>
        <h3>Aplicar código de referido</h3>
        <p className="muted">Si alguien te invitó, ingresa su código aquí.</p>
        <label>
          Código
          <input
            value={applyCode}
            onChange={(event) => setApplyCode(event.target.value.toUpperCase())}
            placeholder="MONTATE-AB12"
            required
          />
        </label>
        <button className="button-dark" type="submit" disabled={loading}>
          {loading ? "Aplicando..." : "Aplicar código"}
        </button>
      </form>

      <section className="card">
        <h3>Historial de eventos</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3}>Sin eventos aún.</td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.eventType}</td>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                    <td>{Object.keys(event.eventMetadata).length ? JSON.stringify(event.eventMetadata) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Rewards</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rewards.length === 0 ? (
                <tr>
                  <td colSpan={4}>No hay rewards aún.</td>
                </tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td>{reward.rewardType}</td>
                    <td>USD {reward.rewardValue.toFixed(2)}</td>
                    <td>{reward.rewardStatus}</td>
                    <td>{new Date(reward.createdAt).toLocaleDateString()}</td>
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
