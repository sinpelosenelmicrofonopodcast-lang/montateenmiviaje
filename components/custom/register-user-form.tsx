"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function RegisterUserForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!supabase) {
        throw new Error("Supabase no está configurado");
      }

      if (password.length < 8) {
        throw new Error("La contraseña debe tener mínimo 8 caracteres");
      }

      if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const normalizedPhone = phone.trim();
      if (normalizedPhone.length < 7) {
        throw new Error("Ingresa un número de teléfono válido");
      }

      const signUp = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: normalizedPhone
          }
        }
      });

      if (signUp.error) {
        throw new Error(signUp.error.message);
      }

      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: normalizedPhone,
          authUserId: signUp.data.user?.id
        })
      });

      const payload = (await response.json()) as { message?: string; isRegistered?: boolean };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo completar el registro");
      }

      if (signUp.data.session) {
        router.push("/portal");
        router.refresh();
        return;
      }

      setMessage(
        payload.isRegistered
          ? "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión en el portal."
          : "Registro procesado."
      );
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (registerError) {
      const errMessage = registerError instanceof Error ? registerError.message : "Error inesperado";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleRegister}>
      <h3>Crear cuenta de cliente</h3>
      <p className="muted">Con tu cuenta podrás entrar al portal privado, sorteos y documentos de viaje.</p>
      <div className="request-grid">
        <label>
          Nombre completo
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Teléfono (WhatsApp)
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirmar contraseña
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
      </div>
      <button className="button-dark" type="submit" disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <p className="muted">
        ¿Ya tienes cuenta? <Link href="/portal/login">Inicia sesión aquí</Link>.
      </p>
    </form>
  );
}
