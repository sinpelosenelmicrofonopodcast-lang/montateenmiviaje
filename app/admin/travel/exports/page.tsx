import { TravelExportsWorkspace } from "@/components/custom/travel/travel-exports-workspace";
import {
  listTravelAuditLogsService,
  listTravelPdfExportsService,
  listTravelSearchSessionsService
} from "@/lib/travel/services/travel-service";

export const dynamic = "force-dynamic";

export default async function AdminTravelExportsPage() {
  const [exportsList, searches, logs] = await Promise.all([
    listTravelPdfExportsService(),
    listTravelSearchSessionsService(40),
    listTravelAuditLogsService(80)
  ]);

  return <TravelExportsWorkspace initialExports={exportsList} initialSearches={searches} initialLogs={logs} />;
}

