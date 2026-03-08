"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./raffle-countdown.module.css";

interface RaffleCountdownProps {
  drawAt: string;
  drawnAt?: string;
  winnerNumber?: number;
  availableNumbers?: number;
  totalNumbers?: number;
}

function formatTime(ms: number) {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
}

export function RaffleCountdown({ drawAt, drawnAt, winnerNumber, availableNumbers, totalNumbers }: RaffleCountdownProps) {
  const router = useRouter();
  const target = useMemo(() => new Date(drawAt).getTime(), [drawAt]);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(target - Date.now(), 0));
  const refreshed = useRef(false);

  useEffect(() => {
    if (Number.isNaN(target) || drawnAt) {
      return;
    }

    const timer = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        if (!refreshed.current) {
          refreshed.current = true;
          router.refresh();
        }
        return;
      }

      setRemainingMs(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [drawnAt, router, target]);

  if (drawnAt) {
    return (
      <div className={`card ${styles.countdownCard}`}>
        <p className={styles.eyebrow}>Resultado oficial</p>
        <h3 className={styles.title}>Sorteo finalizado</h3>
        {winnerNumber ? (
          <p className={styles.result}>
            Número ganador: <strong className={styles.winner}>#{winnerNumber}</strong>
          </p>
        ) : (
          <p className="muted">El sorteo cerró sin participaciones confirmadas.</p>
        )}
      </div>
    );
  }

  const time = formatTime(remainingMs);
  const sold = Number.isFinite(totalNumbers) && Number.isFinite(availableNumbers)
    ? Math.max((totalNumbers ?? 0) - (availableNumbers ?? 0), 0)
    : null;
  const soldPercent = sold !== null && totalNumbers && totalNumbers > 0 ? Math.round((sold / totalNumbers) * 100) : null;
  const urgencyCopy =
    typeof availableNumbers === "number" && availableNumbers <= 15
      ? `Solo quedan ${availableNumbers} números disponibles.`
      : typeof soldPercent === "number" && soldPercent >= 50
        ? `Más del ${soldPercent}% ya fue reservado.`
        : "Selecciona tu número antes del cierre.";

  return (
    <div className={`card ${styles.countdownCard}`}>
      <p className={styles.eyebrow}>Cuenta regresiva</p>
      <h3 className={styles.title}>El sorteo se anuncia en</h3>
      <div className={styles.units}>
        <div className={styles.unit}>
          <p className={styles.value}>{time.days}</p>
          <p className={styles.label}>días</p>
        </div>
        <div className={styles.unit}>
          <p className={styles.value}>{time.hours}</p>
          <p className={styles.label}>horas</p>
        </div>
        <div className={styles.unit}>
          <p className={styles.value}>{time.minutes}</p>
          <p className={styles.label}>min</p>
        </div>
        <div className={styles.unit}>
          <p className={styles.value}>{time.seconds}</p>
          <p className={styles.label}>seg</p>
        </div>
      </div>
      <p className={styles.note}>{urgencyCopy}</p>
      <p className="muted">Cuando llegue a 0, se ejecuta el draw verificable automáticamente.</p>
    </div>
  );
}
