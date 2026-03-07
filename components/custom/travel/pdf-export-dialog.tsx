"use client";

import { useState } from "react";

interface PdfExportDialogProps {
  quoteId?: string;
  packageId?: string;
  onGenerate: (payload: { kind: "quote" | "package" | "summary"; quoteId?: string; packageId?: string }) => Promise<void> | void;
}

export function PdfExportDialog({ quoteId, packageId, onGenerate }: PdfExportDialogProps) {
  const [kind, setKind] = useState<"quote" | "package" | "summary">(quoteId ? "quote" : packageId ? "package" : "summary");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      await onGenerate({ kind, quoteId, packageId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h3>Exportar PDF</h3>
      <label>
        Tipo
        <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
          <option value="quote" disabled={!quoteId}>
            Cotización
          </option>
          <option value="package" disabled={!packageId}>
            Paquete
          </option>
          <option value="summary">Resumen interno</option>
        </select>
      </label>
      <button type="button" className="button-dark" onClick={handleGenerate} disabled={loading}>
        {loading ? "Generando..." : "Generar PDF"}
      </button>
    </section>
  );
}
