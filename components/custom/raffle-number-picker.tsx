"use client";

import { useMemo, useState } from "react";
import styles from "./raffle-number-picker.module.css";

interface RaffleNumberPickerProps {
  availableNumbers: number[];
  selectedNumbers: number[];
  onSelectedNumbersChange: (numbers: number[]) => void;
}

export function RaffleNumberPicker({
  availableNumbers,
  selectedNumbers,
  onSelectedNumbersChange
}: RaffleNumberPickerProps) {
  const [query, setQuery] = useState("");

  const filteredNumbers = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return availableNumbers;
    return availableNumbers.filter((number) => String(number).includes(normalized));
  }, [availableNumbers, query]);

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
          {filteredNumbers.length > 0 ? filteredNumbers.slice(0, 300).map((number) => (
            <button
              key={number}
              type="button"
              className={`${styles.tile} ${selectedNumbers.includes(number) ? styles.tileActive : ""}`}
              onClick={() => {
                if (selectedNumbers.includes(number)) {
                  onSelectedNumbersChange(selectedNumbers.filter((value) => value !== number));
                  return;
                }
                onSelectedNumbersChange([...selectedNumbers, number]);
              }}
            >
              #{number}
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
      </div>
    </section>
  );
}
