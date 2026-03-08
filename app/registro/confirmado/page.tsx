import { EmailConfirmationPanel } from "@/components/custom/email-confirmation-panel";

export const dynamic = "force-dynamic";

export default function RegistroConfirmadoPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Registro</p>
        <h1>Confirmación de cuenta</h1>
        <p className="section-subtitle">
          Estamos validando tu correo para activar tu perfil de cliente en Móntate en mi viaje.
        </p>
      </header>
      <EmailConfirmationPanel />
    </main>
  );
}
