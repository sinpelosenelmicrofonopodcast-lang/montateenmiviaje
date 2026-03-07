"use client";

import { useState } from "react";
import { PdfExportDialog } from "@/components/custom/travel/pdf-export-dialog";
import { TravelHistoryTable } from "@/components/custom/travel/travel-history-table";
import { TravelStatusBadge } from "@/components/custom/travel/travel-status-badge";
import type { TravelAuditLog, TravelPdfExport, TravelSearchSession } from "@/lib/travel/types";

interface TravelExportsWorkspaceProps {
  initialExports: TravelPdfExport[];
  initialSearches: TravelSearchSession[];
  initialLogs: TravelAuditLog[];
}

export function TravelExportsWorkspace({ initialExports, initialSearches, initialLogs }: TravelExportsWorkspaceProps) {
  const [exportsList, setExportsList] = useState(initialExports);
  const [searches, setSearches] = useState(initialSearches);
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshAll() {
    const [exportsRes, historyRes] = await Promise.all([
      fetch("/api/admin/travel/exports", { cache: "no-store" }),
      fetch("/api/admin/travel/history", { cache: "no-store" })
    ]);

    const exportsPayload = (await exportsRes.json()) as { exports?: TravelPdfExport[]; message?: string };
    const historyPayload = (await historyRes.json()) as {
      searches?: TravelSearchSession[];
      logs?: TravelAuditLog[];
      message?: string;
    };

    if (!exportsRes.ok || !exportsPayload.exports) {
      throw new Error(exportsPayload.message ?? "No se pudo refrescar exports");
    }
    if (!historyRes.ok || !historyPayload.searches || !historyPayload.logs) {
      throw new Error(historyPayload.message ?? "No se pudo refrescar historial");
    }

    setExportsList(exportsPayload.exports);
    setSearches(historyPayload.searches);
    setLogs(historyPayload.logs);
  }

  async function handleGenerate(payload: { kind: "quote" | "package" | "summary"; quoteId?: string; packageId?: string }) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/exports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { downloadUrl?: string; message?: string };
      if (!response.ok || !result.downloadUrl) {
        throw new Error(result.message ?? "No se pudo generar PDF");
      }

      await refreshAll();
      setMessage(`PDF generado. Descargar: ${result.downloadUrl}`);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack-grid">
      <section className="card">
        <div className="table-head-row">
          <div>
            <h3>Exports PDF</h3>
            <p className="muted">Cotizaciones, paquetes y resúmenes internos guardados con trazabilidad.</p>
          </div>
          <PdfExportDialog onGenerate={handleGenerate} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Relacionado</th>
                <th>Archivo</th>
                <th>Status</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {exportsList.map((item) => (
                <tr key={item.id}>
                  <td>{item.relatedType}</td>
                  <td>{item.relatedId}</td>
                  <td>{item.fileName}</td>
                  <td><TravelStatusBadge status={item.status} /></td>
                  <td>{new Date(item.createdAt).toLocaleString("es-ES")}</td>
                  <td>
                    <a className="button-outline" href={`/api/admin/travel/exports/${item.id}/download`}>
                      Descargar
                    </a>
                  </td>
                </tr>
              ))}
              {exportsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin exports todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <TravelHistoryTable searches={searches} logs={logs} />

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Procesando...</p> : null}
    </section>
  );
}
