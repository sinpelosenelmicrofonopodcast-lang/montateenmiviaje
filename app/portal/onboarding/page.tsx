import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalOnboardingFlow } from "@/components/custom/portal/portal-onboarding-flow";
import { getPortalGrowthBundleService } from "@/lib/growth-service";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalOnboardingPage() {
  const [session, cookieStore] = await Promise.all([requirePortalSession(), cookies()]);
  const bundle = await getPortalGrowthBundleService(session.user.id, session.email);

  if (bundle.onboarding?.onboardingCompleted) {
    redirect("/portal");
  }

  const referralCode = cookieStore.get("mmv_ref")?.value?.trim().toUpperCase();

  return (
    <PortalOnboardingFlow
      initialProfile={bundle.profile}
      initialOnboarding={bundle.onboarding}
      initialReferralCode={referralCode}
    />
  );
}
