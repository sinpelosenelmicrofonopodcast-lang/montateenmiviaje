"use client";

import { useMemo, useState } from "react";
import { PdfExportDialog } from "@/components/custom/travel/pdf-export-dialog";
import { TravelFiltersBar } from "@/components/custom/travel/travel-filters-bar";
import { TravelStatusBadge } from "@/components/custom/travel/travel-status-badge";
import type { TravelQuote } from "@/lib/travel/types";

interface TravelQuotesWorkspaceProps {
  initialQuotes: TravelQuote[];
}

function formatMoney(value: number, currency = "USD") {
  return `${currency} ${value.toFixed(2)}`;
}

export function TravelQuotesWorkspace({ initialQuotes }: TravelQuotesWorkspaceProps) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<TravelQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    destination: "",
    clientName: "",
    clientEmail: "",
    amount: "0",
    notesClient: ""
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return quotes;
    return quotes.filter((quote) =>
      [
        quote.quoteNumber,
        quote.destination,
        quote.clientName ?? "",
        quote.clientEmail ?? "",
        quote.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [quotes, search]);

  async function refreshQuotes() {
    const response = await fetch("/api/admin/travel/quotes", { cache: "no-store" });
    const payload = (await response.json()) as { quotes?: TravelQuote[]; message?: string };
    if (!response.ok || !payload.quotes) {
      throw new Error(payload.message ?? "No se pudieron cargar cotizaciones");
    }
    setQuotes(payload.quotes);
  }

  async function changeStatus(quote: TravelQuote, status: TravelQuote["status"]) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/travel/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo actualizar status");
      }
      await refreshQuotes();
      setMessage(`Cotización ${quote.quoteNumber} actualizada a ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function createManualQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: manualForm.destination,
          clientName: manualForm.clientName || undefined,
          clientEmail: manualForm.clientEmail || undefined,
          status: "draft",
          notesClient: manualForm.notesClient || undefined,
          items: [
            {
              itemType: "manual",
              title: "Bloque manual Travel Desk",
              basePrice: Number(manualForm.amount || "0"),
              taxes: 0
            }
          ]
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo crear cotización manual");
      }
      await refreshQuotes();
      setManualForm({ destination: "", clientName: "", clientEmail: "", amount: "0", notesClient: "" });
      setMessage("Cotización manual creada.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePdf(payload: { kind: "quote" | "package" | "summary"; quoteId?: string; packageId?: string }) {
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
      setMessage(`PDF generado. Descargar: ${result.downloadUrl}`);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack-grid">
      <TravelFiltersBar
        search={search}
        onSearchChange={setSearch}
        helper="Pipeline quote: draft → sent → approved/expired/cancelled"
      />

      <form className="card request-grid" onSubmit={createManualQuote}>
        <h3 className="request-full">Crear cotización manual</h3>
        <label>
          Destino
          <input
            value={manualForm.destination}
            onChange={(event) => setManualForm({ ...manualForm, destination: event.target.value })}
            required
          />
        </label>
        <label>
          Cliente
          <input
            value={manualForm.clientName}
            onChange={(event) => setManualForm({ ...manualForm, clientName: event.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={manualForm.clientEmail}
            onChange={(event) => setManualForm({ ...manualForm, clientEmail: event.target.value })}
          />
        </label>
        <label>
          Monto base
          <input
            type="number"
            min={0}
            value={manualForm.amount}
            onChange={(event) => setManualForm({ ...manualForm, amount: event.target.value })}
            required
          />
        </label>
        <label className="request-full">
          Nota cliente
          <textarea
            rows={3}
            value={manualForm.notesClient}
            onChange={(event) => setManualForm({ ...manualForm, notesClient: event.target.value })}
          />
        </label>
        <button className="button-dark request-full" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar draft"}
        </button>
      </form>

      <section className="card">
        <h3>Cotizaciones</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Cliente</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Total</th>
                <th>Items</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.quoteNumber}</td>
                  <td>
                    {quote.clientName ?? "N/A"}
                    <br />
                    <span className="muted">{quote.clientEmail ?? ""}</span>
                  </td>
                  <td>{quote.destination}</td>
                  <td><TravelStatusBadge status={quote.status} /></td>
                  <td>{formatMoney(quote.grandTotal, quote.currency)}</td>
                  <td>{quote.items.length}</td>
                  <td>
                    <div className="button-row">
                      <button type="button" className="button-outline" onClick={() => setSelectedQuote(quote)}>
                        Ver
                      </button>
                      <button type="button" className="button-outline" onClick={() => changeStatus(quote, "sent")}>
                        Mark sent
                      </button>
                      <button type="button" className="button-outline" onClick={() => changeStatus(quote, "approved")}>
                        Approve
                      </button>
                      <button type="button" className="button-outline" onClick={() => changeStatus(quote, "expired")}>
                        Expire
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No hay cotizaciones en este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedQuote ? (
        <section className="card">
          <div className="table-head-row">
            <div>
              <h3>Detalle {selectedQuote.quoteNumber}</h3>
              <p className="muted">
                {selectedQuote.destination} · {selectedQuote.items.length} item(s)
              </p>
            </div>
            <button type="button" className="button-outline" onClick={() => setSelectedQuote(null)}>
              Cerrar
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuote.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemType}</td>
                    <td>{item.title}</td>
                    <td>{item.providerName ?? "N/A"}</td>
                    <td>{formatMoney(item.totalPrice, selectedQuote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PdfExportDialog quoteId={selectedQuote.id} onGenerate={handleGeneratePdf} />
        </section>
      ) : null}

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
