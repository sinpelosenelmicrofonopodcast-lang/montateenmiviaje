import { TravelHotelsWorkspace } from "@/components/custom/travel/travel-hotels-workspace";
import { listTravelPackagesService } from "@/lib/travel/services/travel-service";

export const dynamic = "force-dynamic";

export default async function AdminTravelHotelsPage() {
  const packages = await listTravelPackagesService();
  return <TravelHotelsWorkspace initialPackages={packages} />;
}

