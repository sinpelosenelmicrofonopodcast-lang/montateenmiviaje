import { AdminNotificationsManager } from "@/components/custom/admin-notifications-manager";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getAdminNotificationDashboardService } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdminServerAccess();
  const dashboard = await getAdminNotificationDashboardService({ limit: 250 });

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Notificaciones</p>
        <h1>Centro multicanal</h1>
        <p className="section-subtitle">Push OneSignal, email transaccional e inbox interno desde una capa unificada.</p>
      </header>

      <AdminNotificationsManager
        initialMetrics={dashboard.metrics}
        initialEvents={dashboard.events}
        initialDeliveries={dashboard.deliveries}
      />
    </main>
  );
}
