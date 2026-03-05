"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface RaffleCountdownProps {
  drawAt: string;
  drawnAt?: string;
  winnerNumber?: number;
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

export function RaffleCountdown({ drawAt, drawnAt, winnerNumber }: RaffleCountdownProps) {
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
      <div className="card">
        <h3>Resultado del sorteo</h3>
        {winnerNumber ? (
          <p>
            Número ganador: <strong>#{winnerNumber}</strong>
          </p>
        ) : (
          <p>El sorteo cerró sin participaciones confirmadas.</p>
        )}
      </div>
    );
  }

  const time = formatTime(remainingMs);

  return (
    <div className="card">
      <h3>Countdown anuncio ganador</h3>
      <p className="countdown-clock">
        {time.days}d : {time.hours}h : {time.minutes}m : {time.seconds}s
      </p>
      <p className="muted">Cuando llegue a 0, la app ejecuta el sorteo automáticamente.</p>
    </div>
  );
}
