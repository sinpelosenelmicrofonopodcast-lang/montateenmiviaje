import { TravelFlightsWorkspace } from "@/components/custom/travel/travel-flights-workspace";
import { listTravelPackagesService } from "@/lib/travel/services/travel-service";

export const dynamic = "force-dynamic";

export default async function AdminTravelFlightsPage() {
  const packages = await listTravelPackagesService();
  return <TravelFlightsWorkspace initialPackages={packages} />;
}
