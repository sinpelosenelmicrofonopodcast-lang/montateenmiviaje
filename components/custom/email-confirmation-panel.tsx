"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ConfirmationState = "loading" | "ready" | "needs_login" | "error";

export function EmailConfirmationPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<ConfirmationState>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveConfirmation() {
      try {
        if (!supabase) {
          throw new Error("Configuración de autenticación no disponible.");
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const callbackError = url.searchParams.get("error_description");

        if (callbackError) {
          throw new Error(decodeURIComponent(callbackError));
        }

        if (code) {
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          if (exchanged.error) {
            throw new Error(exchanged.error.message);
          }

          url.searchParams.delete("code");
          url.searchParams.delete("type");
          window.history.replaceState({}, "", url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""));
        }

        const userResult = await supabase.auth.getUser();
        if (userResult.error) {
          throw new Error(userResult.error.message);
        }

        if (!isMounted) {
          return;
        }

        if (userResult.data.user?.email) {
          setEmail(userResult.data.user.email);
          setState("ready");
          return;
        }

        setState("needs_login");
      } catch (confirmationError) {
        if (!isMounted) {
          return;
        }
        setError(confirmationError instanceof Error ? confirmationError.message : "No se pudo validar tu confirmación.");
        setState("error");
      }
    }

    void resolveConfirmation();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <section className="card admin-auth-card">
      <h1>Correo confirmado</h1>
      {state === "loading" ? <p className="muted">Validando tu confirmación...</p> : null}

      {state === "ready" ? (
        <>
          <p className="success">
            Tu cuenta quedó verificada{email ? ` para ${email}` : ""}. Ya puedes continuar al portal privado.
          </p>
          <p className="muted">Desde ahí podrás completar tu perfil, ver viajes, pagos y documentos.</p>
          <div className="hero-actions">
            <Link className="button-dark" href="/portal/onboarding">
              Entrar al portal
            </Link>
            <Link className="button-outline" href="/portal/perfil">
              Ver mi perfil
            </Link>
          </div>
        </>
      ) : null}

      {state === "needs_login" ? (
        <>
          <p className="success">Tu correo fue confirmado correctamente.</p>
          <p className="muted">Inicia sesión para acceder a tu perfil y terminar tu onboarding.</p>
          <div className="hero-actions">
            <Link className="button-dark" href="/portal/login">
              Ir a login
            </Link>
            <Link className="button-outline" href="/portal/register">
              Crear cuenta
            </Link>
          </div>
        </>
      ) : null}

      {state === "error" ? (
        <>
          <p className="error">{error ?? "No se pudo completar la confirmación."}</p>
          <p className="muted">
            Si el enlace expiró, solicita uno nuevo iniciando sesión o creando tu cuenta otra vez con el mismo correo.
          </p>
          <div className="hero-actions">
            <Link className="button-dark" href="/portal/login">
              Ir a login
            </Link>
            <Link className="button-outline" href="/portal/register">
              Volver a registro
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
