"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface RegisterUserFormProps {
  initialReferralCode?: string;
}

export function RegisterUserForm({ initialReferralCode }: RegisterUserFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Puerto Rico");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode ?? "");
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
      const normalizedCountry = country.trim();
      if (normalizedCountry.length < 2) {
        throw new Error("Selecciona un país válido");
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (fullName.length < 3) {
        throw new Error("Debes indicar nombre y apellido");
      }

      const signUp = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            phone: normalizedPhone || null,
            country: normalizedCountry,
            referral_code: referralCode.trim() || null,
            registration_source: "portal_signup"
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
          firstName,
          lastName,
          email,
          country: normalizedCountry,
          phone: normalizedPhone || undefined,
          referralCode: referralCode.trim() || undefined,
          registrationSource: "portal_signup",
          authUserId: signUp.data.user?.id ?? undefined
        })
      });

      const payload = (await response.json()) as { message?: string; isRegistered?: boolean };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo completar el registro");
      }

      if (signUp.data.session) {
        router.push("/portal/onboarding");
        router.refresh();
        return;
      }

      setMessage(
        payload.isRegistered
          ? "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión en el portal."
          : "Registro procesado."
      );
      setFirstName("");
      setLastName("");
      setEmail("");
      setCountry("Puerto Rico");
      setPhone("");
      setReferralCode("");
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
          Nombre
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
        </label>
        <label>
          Apellido
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
        </label>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          País
          <input value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" required />
        </label>
        <label>
          Teléfono (opcional)
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
          />
        </label>
        <label>
          Código de referido (opcional)
          <input
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
            placeholder="MONTATE-AB12"
            autoComplete="off"
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
