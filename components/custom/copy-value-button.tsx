"use client";

import { useState } from "react";

interface CopyValueButtonProps {
  value: string;
  label?: string;
}

export function CopyValueButton({ value, label = "Copiar" }: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="button-outline" onClick={() => void copyValue()}>
      {copied ? "Copiado" : label}
    </button>
  );
}
