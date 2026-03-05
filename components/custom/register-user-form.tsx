"use client";

import { useState } from "react";

export function RegisterUserForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email })
      });

      const payload = (await response.json()) as { message?: string; isRegistered?: boolean };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo completar el registro");
      }

      setMessage(payload.isRegistered ? "Registro completado. Ya puedes participar en sorteos." : "Registro procesado.");
      setFullName("");
      setEmail("");
    } catch (registerError) {
      const errMessage = registerError instanceof Error ? registerError.message : "Error inesperado";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleRegister}>
      <h3>Registro de usuario</h3>
      <p className="muted">El registro es obligatorio para participar en sorteos y rifas.</p>
      <div className="request-grid">
        <label>
          Nombre completo
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
      </div>
      <button className="button-dark" type="submit" disabled={loading}>
        {loading ? "Registrando..." : "Registrarme"}
      </button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
