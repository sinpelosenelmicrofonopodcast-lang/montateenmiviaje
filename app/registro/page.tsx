import { cookies } from "next/headers";
import { RegisterUserForm } from "@/components/custom/register-user-form";

interface RegistroPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const initialReferralCode = params.ref?.trim().toUpperCase() || cookieStore.get("mmv_ref")?.value?.trim().toUpperCase() || undefined;

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Registro</p>
        <h1>Crea tu cuenta de cliente</h1>
        <p className="section-subtitle">
          Esta cuenta te permite acceder al portal privado, sorteos y gestión de documentos.
        </p>
      </header>
      <RegisterUserForm initialReferralCode={initialReferralCode} />
    </main>
  );
}
