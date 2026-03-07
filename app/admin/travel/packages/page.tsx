import { TravelPackagesWorkspace } from "@/components/custom/travel/travel-packages-workspace";
import { listTravelPackagesService, listTravelQuotesService } from "@/lib/travel/services/travel-service";

export const dynamic = "force-dynamic";

export default async function AdminTravelPackagesPage() {
  const [packages, quotes] = await Promise.all([listTravelPackagesService(), listTravelQuotesService()]);
  return <TravelPackagesWorkspace initialPackages={packages} initialQuotes={quotes} />;
}

