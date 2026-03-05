"use client";

import { useMemo, useState } from "react";
import { Raffle, RaffleEntry } from "@/lib/types";

interface AdminRafflePanelProps {
  initialRaffles: Raffle[];
  initialEntries: RaffleEntry[];
}

export function AdminRafflePanel({ initialRaffles, initialEntries }: AdminRafflePanelProps) {
  const [raffles, setRaffles] = useState(initialRaffles);
  const [entries, setEntries] = useState(initialEntries);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [entryFee, setEntryFee] = useState(0);
  const [paymentInstructions, setPaymentInstructions] = useState("No requiere pago.");
  const [requirements, setRequirements] = useState("Usuario registrado.");
  const [prize, setPrize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drawAt, setDrawAt] = useState("");
  const [numberPoolSize, setNumberPoolSize] = useState(100);
  const [status, setStatus] = useState<Raffle["status"]>("draft");
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

  async function refresh() {
    const response = await fetch("/api/admin/raffles", { cache: "no-store" });
    const payload = (await response.json()) as { raffles: Raffle[]; entries: RaffleEntry[] };
    setRaffles(payload.raffles);
    setEntries(payload.entries);
  }

  async function createRaffle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      const drawAtDate = new Date(drawAt);
      if (Number.isNaN(drawAtDate.getTime())) {
        throw new Error("Define una fecha/hora válida para anunciar el ganador");
      }

      const response = await fetch("/api/admin/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isFree,
          entryFee: isFree ? 0 : entryFee,
          paymentInstructions,
          requirements,
          prize,
          startDate,
          endDate,
          drawAt: drawAtDate.toISOString(),
          numberPoolSize,
          status
        })
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear el sorteo");
      }

      await refresh();
      setTitle("");
      setDescription("");
      setPrize("");
      setDrawAt("");
      setFeedback("Sorteo guardado correctamente.");
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Error inesperado";
      setError(message);
    }
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
      <form onSubmit={createRaffle} className="card">
        <h3>Crear sorteo/rifa</h3>
        <div className="request-grid">
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Premio
            <input value={prize} onChange={(event) => setPrize(event.target.value)} required />
          </label>
          <label className="request-full">
            Descripción
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <label>
            Modalidad
            <select value={isFree ? "free" : "paid"} onChange={(event) => setIsFree(event.target.value === "free")}>
              <option value="free">Gratis</option>
              <option value="paid">Pago por entrada</option>
            </select>
          </label>
          <label>
            Costo de entrada (USD)
            <input
              type="number"
              min={0}
              value={entryFee}
              onChange={(event) => setEntryFee(Number(event.target.value) || 0)}
              disabled={isFree}
            />
          </label>
          <label>
            Inicio
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </label>
          <label>
            Cierre
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
          </label>
          <label>
            Anuncio ganador
            <input
              type="datetime-local"
              value={drawAt}
              onChange={(event) => setDrawAt(event.target.value)}
              required
            />
          </label>
          <label>
            Cantidad de números
            <input
              type="number"
              min={1}
              max={5000}
              value={numberPoolSize}
              onChange={(event) => setNumberPoolSize(Number(event.target.value) || 1)}
              required
            />
          </label>
          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as Raffle["status"])}>
              <option value="draft">Draft</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>
          <label>
            Requisitos
            <input value={requirements} onChange={(event) => setRequirements(event.target.value)} required />
          </label>
          <label className="request-full">
            Instrucciones de pago
            <textarea
              rows={3}
              value={paymentInstructions}
              onChange={(event) => setPaymentInstructions(event.target.value)}
              required
            />
          </label>
        </div>
        <button className="button-dark" type="submit">Guardar sorteo/rifa</button>
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
