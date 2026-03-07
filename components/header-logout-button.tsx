"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type HeaderLogoutButtonProps = {
  className?: string;
  redirectTo?: string;
  label?: string;
  loadingLabel?: string;
};

export function HeaderLogoutButton({
  className,
  redirectTo = "/portal/login",
  label = "Logout",
  loadingLabel = "Saliendo..."
}: HeaderLogoutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (!supabase) {
      router.push(redirectTo);
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button type="button" className={className} onClick={() => void handleLogout()} disabled={loading}>
      {loading ? loadingLabel : label}
    </button>
  );
}
