import { AdminLoginForm } from "@/components/custom/admin-login-form";

interface AdminLoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

function mapLoginError(errorCode?: string) {
  if (errorCode === "supabase_not_configured") {
    return "Falta configurar Supabase para autenticación admin.";
  }

  return undefined;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next;
  const initialError = mapLoginError(params.error);

  return (
    <main className="container section">
      <AdminLoginForm nextPath={nextPath} initialError={initialError} />
    </main>
  );
}
