"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { RaffleFaqItem } from "@/lib/types";

const LazyVerificationPanel = dynamic(
  () => import("@/components/custom/raffle-verification-panel").then((mod) => mod.RaffleVerificationPanel),
  {
    ssr: false,
    loading: () => <p className="muted">Cargando transparencia...</p>
  }
);

interface RaffleTransparencyAccordionProps {
  raffleId: string;
  faqItems: RaffleFaqItem[];
}

export function RaffleTransparencyAccordion({ raffleId, faqItems }: RaffleTransparencyAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section id="verificacion" className="card">
      <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: "1rem" }}>
          Ver transparencia del sorteo
        </summary>
        <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
          {open ? <LazyVerificationPanel raffleId={raffleId} showExplainer /> : null}
          <div>
            <h4 style={{ margin: 0 }}>FAQ</h4>
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {faqItems.map((item, index) => (
                <details key={`${item.question}-${index}`} style={{ border: "1px solid #e6eaf1", borderRadius: 12, padding: "8px 10px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>{item.question}</summary>
                  <p className="muted" style={{ margin: "8px 0 0" }}>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
