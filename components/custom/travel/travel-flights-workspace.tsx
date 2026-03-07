"use client";

import { useMemo, useState } from "react";
import { FlightResultsTable } from "@/components/custom/travel/flight-results-table";
import { FlightSearchForm } from "@/components/custom/travel/flight-search-form";
import { QuoteBuilderForm } from "@/components/custom/travel/quote-builder-form";
import { SelectedTripSidebar } from "@/components/custom/travel/selected-trip-sidebar";
import { TravelCompareDrawer } from "@/components/custom/travel/travel-compare-drawer";
import { TravelSearchHeader } from "@/components/custom/travel/travel-search-header";
import type { CreateTravelQuoteInput, FlightSearchInput, NormalizedFlightOffer, TravelPackage } from "@/lib/travel/types";

interface TravelFlightsWorkspaceProps {
  initialPackages: TravelPackage[];
}

export function TravelFlightsWorkspace({ initialPackages }: TravelFlightsWorkspaceProps) {
  const [offers, setOffers] = useState<NormalizedFlightOffer[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<NormalizedFlightOffer[]>([]);
  const [compareFlights, setCompareFlights] = useState<NormalizedFlightOffer[]>([]);
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const providers = useMemo(() => Array.from(new Set(offers.map((offer) => offer.provider))), [offers]);

  function upsertSelected(offer: NormalizedFlightOffer) {
    setSelectedFlights((current) => (current.some((item) => item.id === offer.id) ? current : [...current, offer]));
  }

  function addCompare(offer: NormalizedFlightOffer) {
    setCompareFlights((current) => {
      if (current.some((item) => item.id === offer.id)) {
        return current;
      }
      return [...current, offer].slice(-4);
    });
    setShowCompare(true);
  }

  async function handleSearch(input: FlightSearchInput) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/travel/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { offers?: NormalizedFlightOffer[]; message?: string; cached?: boolean };
      if (!response.ok || !payload.offers) {
        throw new Error(payload.message ?? "No se pudieron cargar vuelos");
      }
      setOffers(payload.offers);
      setMessage(payload.cached ? "Resultados desde caché temporal." : "Búsqueda completada.");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function saveSingleFlightQuote(offer: NormalizedFlightOffer) {
    setSavingQuote(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: `${offer.originAirport}-${offer.destinationAirport}`,
          currency: offer.currency,
          status: "draft",
          items: [
            {
              itemType: "flight",
              providerName: offer.provider,
              externalOfferId: offer.id,
              title: `${offer.airline} ${offer.flightNumber}`,
              summary: {
                departureAt: offer.departureAt,
                arrivalAt: offer.arrivalAt,
                stops: offer.stops
              },
              raw: offer.raw,
              basePrice: offer.basePrice,
              taxes: offer.taxes
            }
          ]
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo guardar vuelo en cotización");
      }
      setMessage("Vuelo guardado como cotización draft.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setSavingQuote(false);
    }
  }

  async function createQuoteFromSelection(input: CreateTravelQuoteInput) {
    setSavingQuote(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/travel/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo crear cotización");
      }
      setMessage("Cotización creada desde selección activa.");
      setSelectedFlights([]);
      setShowQuoteBuilder(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setSavingQuote(false);
    }
  }

  async function attachSelectedToPackage(payload: { packageId?: string; createPackageName?: string }) {
    setSavingQuote(true);
    setError(null);
    setMessage(null);

    try {
      if (selectedFlights.length === 0) {
        throw new Error("No hay vuelos seleccionados para adjuntar.");
      }

      for (const offer of selectedFlights) {
        const response = await fetch("/api/admin/travel/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: payload.packageId,
            createPackageName: payload.createPackageName,
            destination: `${offer.originAirport}-${offer.destinationAirport}`,
            offerType: "flight",
            offer
          })
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(result.message ?? "No se pudo adjuntar vuelo a paquete");
        }
      }

      const refresh = await fetch("/api/admin/travel/packages", { cache: "no-store" });
      const packagePayload = (await refresh.json()) as { packages?: TravelPackage[] };
      if (refresh.ok && packagePayload.packages) {
        setPackages(packagePayload.packages);
      }

      setMessage("Vuelos adjuntados al paquete correctamente.");
      setSelectedFlights([]);
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : "Error inesperado");
    } finally {
      setSavingQuote(false);
    }
  }

  return (
    <section className="travel-workspace-grid">
      <div className="stack-grid">
        <TravelSearchHeader
          title="Flights Desk"
          subtitle="Busca vuelos, compara ofertas y envía resultados al Quote Builder o a paquetes existentes."
          providers={providers}
        />
        <FlightSearchForm onSubmit={handleSearch} loading={loading} />
        <FlightResultsTable offers={offers} onSelect={upsertSelected} onSave={saveSingleFlightQuote} onCompare={addCompare} />

        {showQuoteBuilder ? (
          <QuoteBuilderForm
            selectedFlights={selectedFlights}
            selectedHotels={[]}
            onSubmit={createQuoteFromSelection}
            loading={savingQuote}
          />
        ) : null}

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>

      <SelectedTripSidebar
        selectedFlights={selectedFlights}
        selectedHotels={[]}
        packages={packages}
        onRemoveFlight={(offerId) => setSelectedFlights((current) => current.filter((item) => item.id !== offerId))}
        onRemoveHotel={() => undefined}
        onCreateQuote={() => setShowQuoteBuilder(true)}
        onAttachSelected={attachSelectedToPackage}
      />

      <TravelCompareDrawer
        open={showCompare}
        flights={compareFlights}
        hotels={[]}
        onClose={() => {
          setShowCompare(false);
          setCompareFlights([]);
        }}
      />
    </section>
  );
}
