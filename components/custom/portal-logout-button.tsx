"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function PortalLogoutButton() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (!supabase) {
      router.push("/portal/login");
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      router.push("/portal/login");
      router.refresh();
    }
  }

  return (
    <button className="button-outline" type="button" onClick={() => void handleLogout()}>
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
