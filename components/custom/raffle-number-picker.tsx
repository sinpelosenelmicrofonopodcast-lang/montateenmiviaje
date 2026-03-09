"use client";

import { useMemo, useState } from "react";
import { RaffleNumberStatus } from "@/lib/types";
import styles from "./raffle-number-picker.module.css";

interface RaffleNumberPickerProps {
  availableNumbers: number[];
  numberStates?: Array<{ number: number; status: RaffleNumberStatus }>;
  selectedNumbers: number[];
  onSelectedNumbersChange: (numbers: number[]) => void;
}

const statusLabel: Record<RaffleNumberStatus, string> = {
  available: "Disponible",
  reserved: "Reservado",
  pending_manual_review: "Pendiente",
  sold: "Vendido",
  winner: "Ganador",
  blocked: "Bloqueado",
  cancelled: "No disponible"
};

export function RaffleNumberPicker({
  availableNumbers,
  numberStates,
  selectedNumbers,
  onSelectedNumbersChange
}: RaffleNumberPickerProps) {
  const [query, setQuery] = useState("");

  const fullStateList = useMemo(() => {
    if (numberStates && numberStates.length > 0) {
      return [...numberStates].sort((a, b) => a.number - b.number);
    }
    return availableNumbers.map((number) => ({ number, status: "available" as RaffleNumberStatus }));
  }, [availableNumbers, numberStates]);

  const filteredNumbers = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return fullStateList;
    return fullStateList.filter((item) => String(item.number).includes(normalized));
  }, [fullStateList, query]);

  const selectedLabel = useMemo(() => {
    if (selectedNumbers.length === 0) return "";
    if (selectedNumbers.length <= 10) {
      return selectedNumbers.map((number) => `#${number}`).join(", ");
    }
    return `${selectedNumbers.slice(0, 10).map((number) => `#${number}`).join(", ")} +${selectedNumbers.length - 10} más`;
  }, [selectedNumbers]);

  return (
    <section id="numeros" className="card">
      <h3>Números disponibles</h3>
      <div className={styles.shell}>
        <div className={styles.top}>
          <label className={styles.search}>
            Buscar número
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej: 24"
              inputMode="numeric"
            />
          </label>
          <div className={styles.actions}>
            <button
              type="button"
              className="button-outline"
              onClick={() => {
                const candidates = availableNumbers.filter((number) => !selectedNumbers.includes(number));
                if (!candidates.length) return;
                const random = candidates[Math.floor(Math.random() * candidates.length)];
                onSelectedNumbersChange([...selectedNumbers, random]);
              }}
              disabled={availableNumbers.length === 0}
            >
              Número aleatorio
            </button>
            <button
              type="button"
              className="button-outline"
              onClick={() => onSelectedNumbersChange([])}
              disabled={selectedNumbers.length === 0}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredNumbers.length > 0 ? filteredNumbers.slice(0, 300).map((item) => (
            <button
              key={item.number}
              type="button"
              className={`${styles.tile} ${selectedNumbers.includes(item.number) ? styles.tileActive : ""} ${
                item.status !== "available" ? styles.tileUnavailable : ""
              }`}
              onClick={() => {
                if (item.status !== "available") {
                  return;
                }
                if (selectedNumbers.includes(item.number)) {
                  onSelectedNumbersChange(selectedNumbers.filter((value) => value !== item.number));
                  return;
                }
                onSelectedNumbersChange([...selectedNumbers, item.number]);
              }}
              disabled={item.status !== "available"}
              title={statusLabel[item.status]}
            >
              <span>#{item.number}</span>
              {item.status !== "available" ? (
                <small className={styles.tileStatus}>{statusLabel[item.status]}</small>
              ) : null}
            </button>
          )) : (
            <p className={styles.empty}>No hay resultados con ese filtro.</p>
          )}
        </div>

        {selectedNumbers.length > 0 ? (
          <p className={styles.selected}>
            Seleccionados ({selectedNumbers.length}): <strong>{selectedLabel}</strong>
          </p>
        ) : null}

        <p className={styles.legend}>
          Números en estado <strong>reservado</strong>, <strong>pendiente</strong>, <strong>vendido</strong> o <strong>bloqueado</strong> no pueden seleccionarse.
        </p>
      </div>
    </section>
  );
}
