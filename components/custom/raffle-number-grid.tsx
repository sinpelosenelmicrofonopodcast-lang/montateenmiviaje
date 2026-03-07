"use client";

import { useMemo, useState } from "react";
import { RaffleNumberStatus } from "@/lib/types";

interface RaffleNumberGridProps {
  numbers: Array<{ number: number; status: RaffleNumberStatus }>;
}

export function RaffleNumberGrid({ numbers }: RaffleNumberGridProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RaffleNumberStatus | "all">("all");

  const filtered = useMemo(() => {
    const target = query.trim();
    return numbers.filter((item) => {
      const matchesQuery = !target || String(item.number).includes(target);
      const matchesStatus = status === "all" || item.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [numbers, query, status]);

  return (
    <>
      <div className="filter-row">
        <label>
          Buscar número
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej: 24" />
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value as RaffleNumberStatus | "all")}>
            <option value="all">Todos</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="pending_manual_review">Pendiente revisión</option>
            <option value="sold">Vendido</option>
            <option value="winner">Ganador</option>
            <option value="blocked">Bloqueado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
      </div>
      <div className="raffle-number-grid">
        {filtered.map((item) => (
          <span key={item.number} className={`raffle-number-pill raffle-number-${item.status}`}>
            #{item.number}
          </span>
        ))}
      </div>
      <div className="tag-row">
        <span className="raffle-number-pill raffle-number-available">Disponible</span>
        <span className="raffle-number-pill raffle-number-reserved">Reservado</span>
        <span className="raffle-number-pill raffle-number-pending_manual_review">Pendiente</span>
        <span className="raffle-number-pill raffle-number-sold">Vendido</span>
        <span className="raffle-number-pill raffle-number-winner">Ganador</span>
        <span className="raffle-number-pill raffle-number-blocked">Bloqueado</span>
      </div>
    </>
  );
}
