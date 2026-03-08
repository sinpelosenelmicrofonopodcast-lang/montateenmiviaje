"use client";

import { CopyValueButton } from "@/components/custom/copy-value-button";
import type { RaffleVerificationPayload } from "@/lib/raffles-service";
import styles from "./tombola-shell.module.css";

interface TombolaVerificationCardProps {
  verification: RaffleVerificationPayload | null;
}

export function TombolaVerificationCard({ verification }: TombolaVerificationCardProps) {
  if (!verification) {
    return (
      <section className={`${styles.panel} ${styles.verification}`}>
        <h4>Transparencia verificable</h4>
        <p className="muted">Aún no hay payload de verificación publicado.</p>
      </section>
    );
  }

  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: "Algoritmo", value: verification.algorithm },
    { label: "Seed pública", value: verification.publicSeed },
    { label: "Commit hash", value: verification.commitHash },
    { label: "Draw hash", value: verification.drawHash }
  ];

  return (
    <section className={`${styles.panel} ${styles.verification}`}>
      <div className={styles.panelHeader}>
        <h4>Transparencia verificable</h4>
        <p className="muted">Puedes copiar y validar cada dato del resultado.</p>
      </div>
      <div className={styles.verificationGrid}>
        {rows.map((row) => (
          <article key={row.label} className={styles.verificationRow}>
            <div>
              <p className={styles.verificationLabel}>{row.label}</p>
              <p className={styles.verificationValue}>{row.value ?? "Pendiente"}</p>
            </div>
            {row.value ? <CopyValueButton value={row.value} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
