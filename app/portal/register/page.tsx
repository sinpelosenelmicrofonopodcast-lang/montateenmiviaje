import { redirect } from "next/navigation";
import { RegisterUserForm } from "@/components/custom/register-user-form";
import { getPortalSessionContext } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalRegisterPage() {
  const session = await getPortalSessionContext();
  if (session) {
    redirect("/portal");
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Portal Cliente</p>
        <h1>Crear cuenta</h1>
        <p className="section-subtitle">
          Esta cuenta te da acceso a tus viajes, pagos, documentos y área privada.
        </p>
      </header>
      <RegisterUserForm />
    </main>
  );
}
