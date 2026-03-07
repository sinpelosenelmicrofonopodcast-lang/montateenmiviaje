import { redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/custom/portal-login-form";
import { getPortalSessionContext } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

interface PortalLoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function PortalLoginPage({ searchParams }: PortalLoginPageProps) {
  const [params, session] = await Promise.all([searchParams, getPortalSessionContext()]);
  const nextPath = params.next?.startsWith("/portal") ? params.next : undefined;

  if (session) {
    redirect("/portal/onboarding");
  }

  return (
    <main className="container section">
      <PortalLoginForm nextPath={nextPath} />
    </main>
  );
}
