"use client";

import { useMemo, useState } from "react";
import { Raffle, RaffleEntry } from "@/lib/types";

interface AdminRafflePanelProps {
  initialRaffles: Raffle[];
  initialEntries: RaffleEntry[];
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export function AdminRafflePanel({ initialRaffles, initialEntries }: AdminRafflePanelProps) {
  const [raffles, setRaffles] = useState(initialRaffles);
  const [entries, setEntries] = useState(initialEntries);
  const [editingRaffleId, setEditingRaffleId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    rulesText: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    isFree: true,
    entryFee: "0",
    paymentInstructions: "No requiere pago.",
    requirements: "Usuario registrado.",
    prize: "",
    startDate: "",
    endDate: "",
    drawAt: "",
    numberPoolSize: "100",
    status: "draft" as Raffle["status"],
    seoTitle: "",
    seoDescription: "",
    seoOgImage: ""
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);

  const entriesByRaffle = useMemo(() => {
    const grouped = new Map<string, RaffleEntry[]>();
    for (const entry of entries) {
      const list = grouped.get(entry.raffleId) ?? [];
      list.push(entry);
      grouped.set(entry.raffleId, list);
    }
    return grouped;
  }, [entries]);

  const raffleTitleMap = useMemo(() => {
    const mapped = new Map<string, string>();
    for (const raffle of raffles) {
      mapped.set(raffle.id, raffle.title);
    }
    return mapped;
  }, [raffles]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      rulesText: "",
      imageUrl: "",
      ctaLabel: "",
      ctaHref: "",
      isFree: true,
      entryFee: "0",
      paymentInstructions: "No requiere pago.",
      requirements: "Usuario registrado.",
      prize: "",
      startDate: "",
      endDate: "",
      drawAt: "",
      numberPoolSize: "100",
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      seoOgImage: ""
    });
    setEditingRaffleId(null);
  }

  function startEdit(raffle: Raffle) {
    setEditingRaffleId(raffle.id);
    setFeedback(null);
    setError(null);
    setForm({
      title: raffle.title,
      description: raffle.description,
      rulesText: raffle.rulesText ?? "",
      imageUrl: raffle.imageUrl ?? "",
      ctaLabel: raffle.ctaLabel ?? "",
      ctaHref: raffle.ctaHref ?? "",
      isFree: raffle.isFree,
      entryFee: String(raffle.entryFee),
      paymentInstructions: raffle.paymentInstructions,
      requirements: raffle.requirements,
      prize: raffle.prize,
      startDate: raffle.startDate.slice(0, 10),
      endDate: raffle.endDate.slice(0, 10),
      drawAt: toLocalDateTime(raffle.drawAt),
      numberPoolSize: String(raffle.numberPoolSize),
      status: raffle.status,
      seoTitle: raffle.seoTitle ?? "",
      seoDescription: raffle.seoDescription ?? "",
      seoOgImage: raffle.seoOgImage ?? ""
    });
  }

  async function refresh() {
    const response = await fetch("/api/admin/raffles", { cache: "no-store" });
    const payload = (await response.json()) as { raffles: Raffle[]; entries: RaffleEntry[] };
    setRaffles(payload.raffles);
    setEntries(payload.entries);
  }

  async function saveRaffle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      const drawAtDate = new Date(form.drawAt);
      if (Number.isNaN(drawAtDate.getTime())) {
        throw new Error("Define una fecha/hora válida para anunciar el ganador");
      }

      const payload = {
        title: form.title,
        description: form.description,
        rulesText: form.rulesText || undefined,
        imageUrl: form.imageUrl || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        isFree: form.isFree,
        entryFee: form.isFree ? 0 : Number(form.entryFee || 0),
        paymentInstructions: form.paymentInstructions,
        requirements: form.requirements,
        prize: form.prize,
        startDate: form.startDate,
        endDate: form.endDate,
        drawAt: drawAtDate.toISOString(),
        numberPoolSize: Number(form.numberPoolSize || 1),
        status: form.status,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoOgImage: form.seoOgImage || undefined
      };

      const response = await fetch(editingRaffleId ? `/api/admin/raffles/${editingRaffleId}` : "/api/admin/raffles", {
        method: editingRaffleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? `No se pudo ${editingRaffleId ? "actualizar" : "crear"} el sorteo`);
      }

      await refresh();
      setFeedback(editingRaffleId ? "Sorteo actualizado correctamente." : "Sorteo guardado correctamente.");
      resetForm();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Error inesperado";
      setError(message);
    }
  }

  async function removeRaffle(raffleId: string) {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/${raffleId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar el sorteo");
      return;
    }

    if (editingRaffleId === raffleId) {
      resetForm();
    }

    await refresh();
    setFeedback("Sorteo eliminado.");
  }

  async function updateEntry(entryId: string, nextStatus: RaffleEntry["status"]) {
    setFeedback(null);
    setError(null);
    const response = await fetch(`/api/admin/raffles/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (response.ok) {
      await refresh();
      setFeedback("Estado de participación actualizado.");
      return;
    }

    const payload = (await response.json()) as { message?: string };
    setError(payload.message ?? "No se pudo actualizar la participación");
  }

  async function updateRaffleStatus(raffleId: string, nextStatus: Raffle["status"]) {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/${raffleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo actualizar el estado");
      return;
    }

    await refresh();
    setFeedback(`Sorteo actualizado a "${nextStatus}".`);
  }

  async function drawWinner(raffleId: string) {
    setFeedback(null);
    setError(null);
    setDrawingId(raffleId);

    try {
      const response = await fetch(`/api/admin/raffles/${raffleId}/draw`, { method: "POST" });
      const payload = (await response.json()) as {
        message?: string;
        winner?: { customerEmail: string; chosenNumber: number } | null;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo ejecutar el sorteo");
      }

      await refresh();
      if (payload.winner) {
        setFeedback(`Ganador: ${payload.winner.customerEmail} con el número #${payload.winner.chosenNumber}.`);
      } else {
        setFeedback("Sorteo cerrado sin participaciones confirmadas.");
      }
    } catch (drawError) {
      const message = drawError instanceof Error ? drawError.message : "Error inesperado";
      setError(message);
    } finally {
      setDrawingId(null);
    }
  }

  return (
    <>
      <form onSubmit={saveRaffle} className="card">
        <h3>{editingRaffleId ? "Editar sorteo/rifa" : "Crear sorteo/rifa"}</h3>
        <div className="request-grid">
          <label>
            Título
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Premio
            <input value={form.prize} onChange={(event) => setForm({ ...form, prize: event.target.value })} required />
          </label>
          <label className="request-full">
            Descripción
            <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>
          <label className="request-full">
            Reglas
            <textarea rows={3} value={form.rulesText} onChange={(event) => setForm({ ...form, rulesText: event.target.value })} />
          </label>
          <label>
            Imagen URL
            <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          </label>
          <label>
            CTA label
            <input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
          </label>
          <label>
            CTA href
            <input value={form.ctaHref} onChange={(event) => setForm({ ...form, ctaHref: event.target.value })} />
          </label>
          <label>
            Modalidad
            <select value={form.isFree ? "free" : "paid"} onChange={(event) => setForm({ ...form, isFree: event.target.value === "free" })}>
              <option value="free">Gratis</option>
              <option value="paid">Pago por entrada</option>
            </select>
          </label>
          <label>
            Costo de entrada (USD)
            <input
              type="number"
              min={0}
              value={form.entryFee}
              onChange={(event) => setForm({ ...form, entryFee: event.target.value })}
              disabled={form.isFree}
            />
          </label>
          <label>
            Inicio
            <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
          </label>
          <label>
            Cierre
            <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required />
          </label>
          <label>
            Anuncio ganador
            <input
              type="datetime-local"
              value={form.drawAt}
              onChange={(event) => setForm({ ...form, drawAt: event.target.value })}
              required
            />
          </label>
          <label>
            Cantidad de números
            <input
              type="number"
              min={1}
              max={5000}
              value={form.numberPoolSize}
              onChange={(event) => setForm({ ...form, numberPoolSize: event.target.value })}
              required
            />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Raffle["status"] })}>
              <option value="draft">Draft</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>
          <label>
            Requisitos
            <input value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} required />
          </label>
          <label className="request-full">
            Instrucciones de pago
            <textarea
              rows={3}
              value={form.paymentInstructions}
              onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })}
              required
            />
          </label>
          <label>
            SEO title
            <input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
          </label>
          <label className="request-full">
            SEO description
            <textarea rows={2} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
          </label>
          <label className="request-full">
            SEO og image
            <input value={form.seoOgImage} onChange={(event) => setForm({ ...form, seoOgImage: event.target.value })} />
          </label>
        </div>
        <div className="button-row">
          <button className="button-dark" type="submit">
            {editingRaffleId ? "Actualizar sorteo" : "Guardar sorteo/rifa"}
          </button>
          {editingRaffleId ? (
            <button className="button-outline" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
        {feedback ? <p className="success">{feedback}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>

      <section className="card section">
        <h3>Sorteos y rifas</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Modalidad</th>
                <th>Costo</th>
                <th>Números</th>
                <th>Disponibles</th>
                <th>Confirmadas</th>
                <th>Anuncio</th>
                <th>Ganador</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {raffles.map((raffle) => {
                const raffleEntries = entriesByRaffle.get(raffle.id) ?? [];
                const confirmed = raffleEntries.filter((entry) => entry.status === "confirmed").length;
                const taken = new Set(
                  raffleEntries.filter((entry) => entry.status !== "rejected").map((entry) => entry.chosenNumber)
                ).size;
                const available = Math.max(raffle.numberPoolSize - taken, 0);

                return (
                  <tr key={raffle.id}>
                    <td>{raffle.title}</td>
                    <td>{raffle.isFree ? "Gratis" : "Pago"}</td>
                    <td>{raffle.entryFee}</td>
                    <td>{raffle.numberPoolSize}</td>
                    <td>{available}</td>
                    <td>{confirmed}</td>
                    <td>{new Date(raffle.drawAt).toLocaleString("es-ES")}</td>
                    <td>{raffle.winnerNumber ? `#${raffle.winnerNumber}` : "-"}</td>
                    <td>{raffle.status}</td>
                    <td>
                      <div className="button-row">
                        <button className="button-dark" type="button" onClick={() => startEdit(raffle)}>
                          Editar
                        </button>
                        <button
                          className="button-outline"
                          type="button"
                          disabled={Boolean(raffle.drawnAt)}
                          onClick={() =>
                            void updateRaffleStatus(raffle.id, raffle.status === "published" ? "closed" : "published")
                          }
                        >
                          {raffle.drawnAt ? "Finalizado" : raffle.status === "published" ? "Cerrar" : "Publicar"}
                        </button>
                        <button
                          className="button-dark"
                          type="button"
                          disabled={Boolean(raffle.drawnAt) || drawingId === raffle.id || raffle.status === "draft"}
                          onClick={() => void drawWinner(raffle.id)}
                        >
                          {raffle.drawnAt
                            ? "Sorteado"
                            : raffle.status === "draft"
                              ? "Publica primero"
                              : drawingId === raffle.id
                                ? "Sorteando..."
                                : "Sortear"}
                        </button>
                        <button className="button-outline" type="button" onClick={() => void removeRaffle(raffle.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card section">
        <h3>Participaciones</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sorteo</th>
                <th>Correo</th>
                <th>Número</th>
                <th>Referencia pago</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{raffleTitleMap.get(entry.raffleId) ?? entry.raffleId.slice(0, 8)}</td>
                  <td>{entry.customerEmail}</td>
                  <td>#{entry.chosenNumber}</td>
                  <td>{entry.paymentReference ?? "-"}</td>
                  <td>{entry.status}</td>
                  <td>
                    <div className="button-row">
                      <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "confirmed")}>
                        Confirmar
                      </button>
                      <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "rejected")}>
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
