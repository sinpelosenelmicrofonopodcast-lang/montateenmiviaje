"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AdminLogoutButton() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (!supabase) {
      router.push("/admin/login?error=supabase_not_configured");
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      className="button-outline admin-logout-button"
      type="button"
      onClick={() => void handleLogout()}
      disabled={!supabase}
      title={!supabase ? "Falta configuración de Supabase" : undefined}
    >
      {loading ? "Saliendo..." : "Cerrar sesión admin"}
    </button>
  );
}
