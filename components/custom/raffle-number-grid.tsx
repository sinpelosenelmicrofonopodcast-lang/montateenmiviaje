"use client";

import { useMemo, useState } from "react";
import { RaffleNumberStatus } from "@/lib/types";
import styles from "./raffle-number-grid.module.css";

interface RaffleNumberGridProps {
  numbers: Array<{ number: number; status: RaffleNumberStatus }>;
}

const statusLabels: Record<RaffleNumberStatus | "all", string> = {
  all: "Todos",
  available: "Disponible",
  reserved: "Reservado",
  pending_manual_review: "Pendiente",
  sold: "Vendido",
  winner: "Ganador",
  blocked: "Bloqueado",
  cancelled: "Cancelado"
};

const statusList: Array<RaffleNumberStatus | "all"> = [
  "all",
  "available",
  "reserved",
  "pending_manual_review",
  "sold",
  "winner",
  "blocked",
  "cancelled"
];

export function RaffleNumberGrid({ numbers }: RaffleNumberGridProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RaffleNumberStatus | "all">("all");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const target = query.trim();
    return numbers.filter((item) => {
      const matchesQuery = !target || String(item.number).includes(target);
      const matchesStatus = status === "all" || item.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [numbers, query, status]);

  return (
    <div className={styles.gridShell}>
      <div className={styles.filterBar}>
        <label className={styles.searchLabel}>
          Buscar número
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej: 24"
            inputMode="numeric"
          />
        </label>
        <div className={styles.statusFilters} role="tablist" aria-label="Filtrar números por estado">
          {statusList.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.statusFilter} ${status === item ? styles.statusFilterActive : ""}`}
              onClick={() => setStatus(item)}
            >
              {statusLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {selectedNumber ? <p className={styles.selectedCopy}>Número consultado: <strong>#{selectedNumber}</strong></p> : null}

      <div className={styles.numberGrid}>
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <button
              key={item.number}
              type="button"
              className={`${styles.numberTile} ${styles[`status${item.status}`]} ${
                selectedNumber === item.number ? styles.numberTileSelected : ""
              }`}
              onClick={() => setSelectedNumber(item.number)}
              aria-label={`Número ${item.number}, estado ${statusLabels[item.status]}`}
            >
              <span className={styles.tileNumber}>#{item.number}</span>
              <span className={styles.tileStatus}>{statusLabels[item.status]}</span>
            </button>
          ))
        ) : (
          <div className={styles.emptyState}>No hay números para el filtro seleccionado.</div>
        )}
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendPill} ${styles.statusavailable}`}>Disponible</span>
        <span className={`${styles.legendPill} ${styles.statusreserved}`}>Reservado</span>
        <span className={`${styles.legendPill} ${styles.statuspending_manual_review}`}>Pendiente</span>
        <span className={`${styles.legendPill} ${styles.statussold}`}>Vendido</span>
        <span className={`${styles.legendPill} ${styles.statuswinner}`}>Ganador</span>
        <span className={`${styles.legendPill} ${styles.statusblocked}`}>Bloqueado</span>
      </div>
    </div>
  );
}
