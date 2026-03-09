"use client";

import { useEffect } from "react";

interface BodyClassToggleProps {
  className: string;
}

export function BodyClassToggle({ className }: BodyClassToggleProps) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);

  return null;
}
