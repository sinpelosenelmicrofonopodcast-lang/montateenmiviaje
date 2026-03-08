"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RaffleVerificationPayload } from "@/lib/raffles-service";
import { DrawStatusBadge, type DrawPhase } from "./draw-status-badge";
import { TombolaVerificationCard } from "./tombola-verification-card";
import styles from "./tombola-shell.module.css";

interface TombolaShellProps {
  raffleId: string;
  title: string;
  drawAt: string;
  drawnAt?: string;
  winnerNumber?: number;
  winnerDisplayName?: string | null;
  eligibleNumbers: number[];
  verification: RaffleVerificationPayload | null;
  canRunDraw: boolean;
  liveHref?: string;
  variant?: "embedded" | "fullscreen";
}

function buildTicker(pool: number[]) {
  if (pool.length === 0) return [];
  return Array.from({ length: 18 }, () => pool[Math.floor(Math.random() * pool.length)]);
}

function isReducedMotionEnabled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInitialPhase(drawnAt: string | undefined, drawAt: string, eligibleCount: number): DrawPhase {
  if (drawnAt) return "post";
  if (eligibleCount === 0) return "pending";
  return Date.now() >= new Date(drawAt).getTime() ? "ready" : "pending";
}

export function TombolaShell({
  raffleId,
  title,
  drawAt,
  drawnAt,
  winnerNumber,
  winnerDisplayName,
  eligibleNumbers,
  verification,
  canRunDraw,
  liveHref,
  variant = "embedded"
}: TombolaShellProps) {
  const initialWinner = typeof winnerNumber === "number" ? winnerNumber : verification?.winnerNumber;
  const hasInitialDrawResult = Boolean(drawnAt || verification?.drawnAt);
  const hasStoredWinner = hasInitialDrawResult && typeof initialWinner === "number";
  const [phase, setPhase] = useState<DrawPhase>(() => getInitialPhase(drawnAt, drawAt, eligibleNumbers.length));
  const [ticker, setTicker] = useState<number[]>(() => buildTicker(eligibleNumbers));
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localWinner, setLocalWinner] = useState<number | null>(hasStoredWinner ? initialWinner : null);
  const [localDrawnAt, setLocalDrawnAt] = useState<string | undefined>(drawnAt ?? verification?.drawnAt);
  const [localVerification, setLocalVerification] = useState<RaffleVerificationPayload | null>(verification);
  const [reducedMotion, setReducedMotion] = useState(false);
  const drawTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldShowRunButton =
    canRunDraw && !localDrawnAt && eligibleNumbers.length > 0 && Date.now() >= new Date(drawAt).getTime();
  const hasWinner = Boolean(localDrawnAt) && typeof localWinner === "number";
  const revealLabel =
    phase === "drawing"
      ? "Mezclando números elegibles..."
      : hasWinner
        ? "Número ganador"
        : localDrawnAt
          ? "Resultado publicado"
          : "Ganador por anunciar";
  const revealValue = hasWinner ? `#${localWinner}` : phase === "drawing" ? "..." : "Pendiente";

  const summary = useMemo(
    () => ({
      totalEligible: eligibleNumbers.length,
      drawDate: new Date(drawAt).toLocaleString("es-PR"),
      countdownLabel: localDrawnAt
        ? `Resultado publicado: ${new Date(localDrawnAt).toLocaleString("es-PR")}`
        : `Anuncio programado: ${new Date(drawAt).toLocaleString("es-PR")}`
    }),
    [drawAt, eligibleNumbers.length, localDrawnAt]
  );

  useEffect(() => {
    setReducedMotion(isReducedMotionEnabled());
  }, []);

  useEffect(() => {
    if (localDrawnAt) {
      setPhase("post");
      return;
    }
    setPhase(getInitialPhase(localDrawnAt, drawAt, eligibleNumbers.length));
  }, [drawAt, eligibleNumbers.length, localDrawnAt]);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) clearInterval(drawTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  function startVisualMixing(onReveal: () => void) {
    if (drawTimerRef.current) clearInterval(drawTimerRef.current);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);

    setPhase("drawing");
    if (reducedMotion) {
      onReveal();
      return;
    }

    drawTimerRef.current = setInterval(() => {
      setTicker(buildTicker(eligibleNumbers));
    }, 95);

    revealTimerRef.current = setTimeout(() => {
      if (drawTimerRef.current) {
        clearInterval(drawTimerRef.current);
        drawTimerRef.current = null;
      }
      onReveal();
    }, 3600);
  }

  function revealStoredResult() {
    startVisualMixing(() => {
      setPhase(localDrawnAt ? "post" : "reveal");
    });
  }

  async function runDraw() {
    if (!shouldShowRunButton || isRunning) return;

    setError(null);
    setIsRunning(true);

    try {
      const response = await fetch(`/api/admin/raffles/${raffleId}/draw`, {
        method: "POST"
      });
      const payload = (await response.json()) as {
        message?: string;
        raffle?: { drawnAt?: string; winnerNumber?: number };
        winner?: { chosenNumber?: number } | null;
        verification?: { payload?: RaffleVerificationPayload | null };
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo ejecutar el sorteo");
      }

      const winnerFromPayload = payload.winner?.chosenNumber;
      const winnerFromRaffle = payload.raffle?.winnerNumber;
      const resolvedWinner =
        typeof winnerFromPayload === "number"
          ? winnerFromPayload
          : typeof winnerFromRaffle === "number"
            ? winnerFromRaffle
            : null;

      const resolvedVerification = payload.verification?.payload ?? localVerification;
      setLocalVerification(resolvedVerification ?? null);
      setLocalWinner(resolvedWinner);
      setLocalDrawnAt(payload.raffle?.drawnAt ?? new Date().toISOString());

      startVisualMixing(() => {
        setPhase("post");
      });
    } catch (drawError) {
      const message = drawError instanceof Error ? drawError.message : "No se pudo ejecutar el draw";
      setError(message);
      console.error("Tómbola draw error", drawError);
    } finally {
      setIsRunning(false);
    }
  }

  const wrapperClass = variant === "fullscreen" ? `${styles.shell} ${styles.fullscreen}` : styles.shell;

  return (
    <section className={wrapperClass}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Sorteo en vivo</p>
            <h3 className={styles.title}>Tómbola virtual premium</h3>
            <p className={styles.subtitle}>
              {title}. Sigue la tómbola en tiempo real y consulta el resultado oficial del sorteo.
            </p>
          </div>
          <DrawStatusBadge phase={phase} />
        </div>

        <div className={styles.stats}>
          <article>
            <span>Números elegibles</span>
            <strong>{summary.totalEligible}</strong>
          </article>
          <article>
            <span>Fecha draw</span>
            <strong>{summary.drawDate}</strong>
          </article>
          <article>
            <span>Estado</span>
            <strong>{summary.countdownLabel}</strong>
          </article>
        </div>

        <div className={styles.drum}>
          <div className={`${styles.mixer} ${phase === "drawing" ? styles.mixerRunning : ""}`}>
            {ticker.length > 0 ? (
              ticker.map((number, index) => (
                <span key={`${number}-${index}`} className={styles.ball}>
                  {number}
                </span>
              ))
            ) : (
              <p className={styles.empty}>Aún no hay números elegibles para mezclar.</p>
            )}
          </div>
          <div className={styles.reveal}>
            <p className={styles.revealLabel}>{revealLabel}</p>
            <p className={styles.revealNumber}>{revealValue}</p>
            {winnerDisplayName && hasWinner ? <p className={styles.winnerName}>{winnerDisplayName}</p> : null}
          </div>
        </div>

        <div className={styles.actions}>
          {shouldShowRunButton ? (
            <button className="button-dark" type="button" onClick={() => void runDraw()} disabled={isRunning}>
              {isRunning ? "Ejecutando draw..." : "Iniciar tómbola en vivo"}
            </button>
          ) : null}
          {localDrawnAt ? (
            <button className="button-outline" type="button" onClick={revealStoredResult} disabled={phase === "drawing"}>
              Reproducir reveal
            </button>
          ) : null}
          {variant !== "fullscreen" && liveHref ? (
            <a className="button-outline" href={liveHref} target="_blank" rel="noreferrer">
              Ver modo en vivo
            </a>
          ) : null}
          {variant === "fullscreen" ? (
            <Link className="button-outline" href={`/sorteos/${raffleId}`}>
              Volver al sorteo
            </Link>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}
      </div>

      <TombolaVerificationCard verification={localVerification} />
      <p className={styles.disclaimer}>
        Resultado transparente y verificable con publicación oficial al cierre del sorteo.
      </p>
    </section>
  );
}
