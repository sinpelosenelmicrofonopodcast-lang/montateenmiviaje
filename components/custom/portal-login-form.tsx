"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface PortalLoginFormProps {
  nextPath?: string;
}

export function PortalLoginForm({ nextPath }: PortalLoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error("Supabase no está configurado");
      }

      const signIn = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (signIn.error || !signIn.data.user) {
        throw new Error(signIn.error?.message ?? "No se pudo iniciar sesión");
      }

      router.push(nextPath || "/portal/onboarding");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card admin-auth-card">
      <h1>Ingreso al portal</h1>
      <p className="muted">Accede para ver tus viajes, pagos y documentos privados.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="button-dark" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar al portal"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <p className="muted">
        ¿No tienes cuenta? <Link href="/portal/register">Crear cuenta</Link>.
      </p>
    </section>
  );
}
