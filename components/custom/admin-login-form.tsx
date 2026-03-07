"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AdminLoginFormProps {
  nextPath?: string;
  initialError?: string;
}

export function AdminLoginForm({ nextPath, initialError }: AdminLoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error("Supabase no está configurado en variables públicas");
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (signInError || !data.user) {
        throw new Error(signInError?.message ?? "No se pudo iniciar sesión");
      }

      router.push(nextPath || "/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card admin-auth-card">
      <h1>Admin Login</h1>
      <p className="muted">Acceso restringido para usuarios con rol admin.</p>

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
          {loading ? "Ingresando..." : "Entrar al panel"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <p className="muted">
        ¿No tienes acceso? vuelve al <Link href="/">inicio</Link>.
      </p>
    </section>
  );
}
