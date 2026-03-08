import { PortalNotificationsManager } from "@/components/custom/portal/portal-notifications-manager";
import {
  getUserNotificationPreferencesService,
  listUserNotificationsService
} from "@/lib/notifications/service";
import { requirePortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function PortalNotificationsPage() {
  const session = await requirePortalSession();
  const [notificationData, preferences] = await Promise.all([
    listUserNotificationsService(session.user.id, { limit: 100, offset: 0 }),
    getUserNotificationPreferencesService(session.user.id)
  ]);

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Notificaciones</h1>
        <p className="section-subtitle">Push, email e inbox interno centralizados en tu cuenta.</p>
      </header>

      <PortalNotificationsManager
        initialNotifications={notificationData.notifications}
        initialUnreadCount={notificationData.unreadCount}
        initialPreferences={preferences}
      />
    </main>
  );
}
