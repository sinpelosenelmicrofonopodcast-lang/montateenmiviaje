import styles from "./tombola-shell.module.css";

export type DrawPhase = "pending" | "ready" | "drawing" | "reveal" | "post";

interface DrawStatusBadgeProps {
  phase: DrawPhase;
}

const statusLabels: Record<DrawPhase, string> = {
  pending: "Pendiente",
  ready: "Listo para sortear",
  drawing: "Mezclando números",
  reveal: "Resultado verificado",
  post: "Ganador confirmado"
};

export function DrawStatusBadge({ phase }: DrawStatusBadgeProps) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status${phase}`]}`}>
      {statusLabels[phase]}
    </span>
  );
}
