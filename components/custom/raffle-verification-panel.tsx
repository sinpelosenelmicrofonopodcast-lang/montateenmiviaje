"use client";

import { useState } from "react";
import { CopyValueButton } from "@/components/custom/copy-value-button";
import type { RaffleVerificationResult } from "@/lib/raffles-service";
import styles from "./raffle-verification-panel.module.css";

interface RaffleVerificationPanelProps {
  raffleId: string;
  initialVerification: RaffleVerificationResult;
}

function formatDate(value?: string) {
  if (!value) return "Pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PR");
}

function toBadgeLabel(status: RaffleVerificationResult["status"]) {
  if (status === "verified") return "Resultado verificado";
  if (status === "pending") return "Pendiente de anuncio";
  if (status === "legacy") return "Sistema legacy";
  return "Revisión requerida";
}

function toBadgeClass(status: RaffleVerificationResult["status"]) {
  if (status === "verified") return `${styles.badge} ${styles.badge_verified}`;
  if (status === "pending") return `${styles.badge} ${styles.badge_pending}`;
  if (status === "legacy") return `${styles.badge} ${styles.badge_legacy}`;
  return `${styles.badge} ${styles.badge_failed}`;
}

export function RaffleVerificationPanel({ raffleId, initialVerification }: RaffleVerificationPanelProps) {
  const [verification, setVerification] = useState(initialVerification);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runVerify() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/raffles/${raffleId}/verify`, { cache: "no-store" });
      const payload = (await response.json()) as { verification?: RaffleVerificationResult; message?: string };
      if (!response.ok || !payload.verification) {
        throw new Error(payload.message ?? "No se pudo validar el resultado.");
      }
      setVerification(payload.verification);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "No se pudo validar el resultado.");
    } finally {
      setLoading(false);
    }
  }

  const payload = verification.payload;
  const rows = [
    { label: "Versión", value: payload.verificationVersion ?? "sha256-modulo-v1", copy: false },
    { label: "Algoritmo", value: payload.algorithm, copy: false },
    { label: "Commit hash", value: payload.commitHash ?? "Pendiente", copy: Boolean(payload.commitHash) },
    { label: "Draw hash", value: payload.drawHash ?? "Pendiente", copy: Boolean(payload.drawHash) },
    { label: "Seed pública", value: payload.publicSeed ?? "Pendiente", copy: Boolean(payload.publicSeed) },
    {
      label: "Clave revelada",
      value: payload.revealSecret ?? "Se revela al finalizar el sorteo",
      copy: Boolean(payload.revealSecret)
    }
  ];

  return (
    <section className={styles.panel} id="verificacion">
      <header className={styles.header}>
        <div>
          <h3>Resultado verificable</h3>
          <p className="muted">Cualquier persona puede validar matemáticamente que el resultado no fue alterado.</p>
        </div>
        <span className={toBadgeClass(verification.status)}>{toBadgeLabel(verification.status)}</span>
      </header>

      <div className={styles.statusGrid}>
        <article>
          <p className={styles.label}>Estado</p>
          <p className={styles.value}>{payload.verificationStatus ?? "Pendiente"}</p>
        </article>
        <article>
          <p className={styles.label}>Cierre de venta</p>
          <p className={styles.value}>{formatDate(payload.salesClosedAt ?? payload.drawAt)}</p>
        </article>
        <article>
          <p className={styles.label}>Sorteo ejecutado</p>
          <p className={styles.value}>{formatDate(payload.drawnAt)}</p>
        </article>
        <article>
          <p className={styles.label}>Número ganador</p>
          <p className={styles.value}>{typeof payload.winnerNumber === "number" ? `#${payload.winnerNumber}` : "Pendiente"}</p>
        </article>
      </div>

      <div className={styles.grid}>
        {rows.map((row) => (
          <article key={row.label} className={styles.row}>
            <div>
              <p className={styles.label}>{row.label}</p>
              <p className={styles.mono}>{row.value}</p>
            </div>
            {row.copy && typeof row.value === "string" ? <CopyValueButton value={row.value} /> : null}
          </article>
        ))}
      </div>

      <div className={styles.actions}>
        <button className="button-dark" type="button" onClick={() => void runVerify()} disabled={loading}>
          {loading ? "Verificando..." : "Verificar resultado"}
        </button>
        <a className="button-outline" href={`/sorteos/${raffleId}/acta`} target="_blank" rel="noreferrer">
          Ver acta del sorteo
        </a>
      </div>

      <div className={styles.checkList}>
        <p className={`${styles.checkItem} ${verification.checks.payloadComplete ? styles.checkOk : styles.checkFail}`}>
          {verification.checks.payloadComplete ? "✓" : "✕"} Datos completos para verificación
        </p>
        <p className={`${styles.checkItem} ${verification.checks.commit ? styles.checkOk : styles.checkFail}`}>
          {verification.checks.commit ? "✓" : "✕"} Commit hash coincide con la clave revelada
        </p>
        <p className={`${styles.checkItem} ${verification.checks.drawHash ? styles.checkOk : styles.checkFail}`}>
          {verification.checks.drawHash ? "✓" : "✕"} Draw hash coincide con el cálculo oficial
        </p>
        <p className={`${styles.checkItem} ${verification.checks.winner ? styles.checkOk : styles.checkFail}`}>
          {verification.checks.winner ? "✓" : "✕"} Índice ganador coincide con el número publicado
        </p>
      </div>

      <article className={styles.explainer}>
        <h4>Cómo sabes que este sorteo no fue manipulado</h4>
        <p>
          Antes de sacar el ganador, el sistema publica una huella digital única. Cuando se cierra la rifa, se revela
          la clave original usada para generar el resultado. Con esos datos, cualquier persona puede comprobar que el
          número ganador salió de forma matemática y que no fue cambiado después.
        </p>
        <details className={styles.details}>
          <summary>Ver explicación técnica</summary>
          <p>
            1) Se calcula <strong>commit hash = SHA256(clave)</strong>. 2) Al cerrar ventas se usa
            <strong> SHA256(clave:raffle_id:close_timestamp:total_tickets)</strong> para obtener el draw hash.
            3) El índice ganador es <strong>hash modulo total_tickets</strong>. 4) Ese índice se mapea al número
            elegible ordenado de menor a mayor.
          </p>
        </details>
      </article>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
