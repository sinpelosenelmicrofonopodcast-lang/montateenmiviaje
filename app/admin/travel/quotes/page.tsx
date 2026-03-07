import { TravelQuotesWorkspace } from "@/components/custom/travel/travel-quotes-workspace";
import { listTravelQuotesService } from "@/lib/travel/services/travel-service";

export const dynamic = "force-dynamic";

export default async function AdminTravelQuotesPage() {
  const quotes = await listTravelQuotesService();
  return <TravelQuotesWorkspace initialQuotes={quotes} />;
}

