import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { RegisterUserForm } from "@/components/custom/register-user-form";
import { getPortalSessionContext } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

interface PortalRegisterPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function PortalRegisterPage({ searchParams }: PortalRegisterPageProps) {
  const [session, params, cookieStore] = await Promise.all([getPortalSessionContext(), searchParams, cookies()]);
  if (session) {
    redirect("/portal");
  }

  const fromQuery = params.ref?.trim().toUpperCase();
  const fromCookie = cookieStore.get("mmv_ref")?.value?.trim().toUpperCase();
  const initialReferralCode = fromQuery || fromCookie || undefined;

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Portal Cliente</p>
        <h1>Crear cuenta</h1>
        <p className="section-subtitle">
          Esta cuenta te da acceso a tus viajes, pagos, documentos y área privada.
        </p>
      </header>
      <RegisterUserForm initialReferralCode={initialReferralCode} />
    </main>
  );
}
