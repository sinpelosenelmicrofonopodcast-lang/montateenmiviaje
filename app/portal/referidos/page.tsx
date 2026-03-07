import { PortalReferralsManager } from "@/components/custom/portal/portal-referrals-manager";
import { getReferralDashboardService } from "@/lib/growth-service";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalReferidosPage() {
  const session = await requirePortalSession();
  const referral = await getReferralDashboardService(session.user.id);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Invita y gana</h1>
        <p className="section-subtitle">Comparte tu código y gana créditos por nuevos viajeros que completen reservas.</p>
      </header>

      <PortalReferralsManager
        initialCode={referral.referralCode}
        initialEvents={referral.events}
        initialRewards={referral.rewards}
      />
    </main>
  );
}
