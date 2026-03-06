import { RegisterUserForm } from "@/components/custom/register-user-form";

export default function RegistroPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Registro</p>
        <h1>Crea tu cuenta de cliente</h1>
        <p className="section-subtitle">
          Esta cuenta te permite acceder al portal privado, sorteos y gestión de documentos.
        </p>
      </header>
      <RegisterUserForm />
    </main>
  );
}
