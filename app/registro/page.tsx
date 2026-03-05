import { RegisterUserForm } from "@/components/custom/register-user-form";

export default function RegistroPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Registro</p>
        <h1>Crea tu registro de participante</h1>
        <p className="section-subtitle">
          Debes estar registrado para entrar en sorteos y rifas de la plataforma.
        </p>
      </header>
      <RegisterUserForm />
    </main>
  );
}
