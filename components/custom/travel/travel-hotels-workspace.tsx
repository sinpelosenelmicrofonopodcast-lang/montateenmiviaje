"use client";

import { useMemo, useState } from "react";
import { HotelResultsGrid } from "@/components/custom/travel/hotel-results-grid";
import { HotelSearchForm } from "@/components/custom/travel/hotel-search-form";
import { QuoteBuilderForm } from "@/components/custom/travel/quote-builder-form";
import { SelectedTripSidebar } from "@/components/custom/travel/selected-trip-sidebar";
import { TravelCompareDrawer } from "@/components/custom/travel/travel-compare-drawer";
import { TravelSearchHeader } from "@/components/custom/travel/travel-search-header";
import type { CreateTravelQuoteInput, HotelSearchInput, NormalizedHotelOffer, TravelPackage } from "@/lib/travel/types";

interface TravelHotelsWorkspaceProps {
  initialPackages: TravelPackage[];
}

export function TravelHotelsWorkspace({ initialPackages }: TravelHotelsWorkspaceProps) {
  const [offers, setOffers] = useState<NormalizedHotelOffer[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<NormalizedHotelOffer[]>([]);
  const [compareHotels, setCompareHotels] = useState<NormalizedHotelOffer[]>([]);
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const providers = useMemo(() => Array.from(new Set(offers.map((offer) => offer.provider))), [offers]);

  function upsertSelected(offer: NormalizedHotelOffer) {
    setSelectedHotels((current) => (current.some((item) => item.id === offer.id) ? current : [...current, offer]));
  }

  function addCompare(offer: NormalizedHotelOffer) {
    setCompareHotels((current) => {
      if (current.some((item) => item.id === offer.id)) {
        return current;
      }
      return [...current, offer].slice(-4);
    });
    setShowCompare(true);
  }

  async function handleSearch(input: HotelSearchInput) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/travel/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { offers?: NormalizedHotelOffer[]; message?: string; cached?: boolean };
      if (!response.ok || !payload.offers) {
        throw new Error(payload.message ?? "No se pudieron cargar hoteles");
      }
      setOffers(payload.offers);
      setMessage(payload.cached ? "Resultados desde caché temporal." : "Búsqueda completada.");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function saveSingleHotelQuote(offer: NormalizedHotelOffer) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: offer.address,
          currency: offer.currency,
          status: "draft",
          items: [
            {
              itemType: "hotel",
              providerName: offer.provider,
              externalOfferId: offer.id,
              title: offer.hotelName,
              summary: {
                stars: offer.stars,
                roomType: offer.roomType,
                cancellationPolicy: offer.cancellationPolicy ?? ""
              },
              raw: offer.raw,
              basePrice: offer.totalPrice - offer.taxes,
              taxes: offer.taxes
            }
          ]
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo guardar hotel en cotización");
      }
      setMessage("Hotel guardado como cotización draft.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function createQuoteFromSelection(input: CreateTravelQuoteInput) {
    setSaving(true);
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
      setMessage("Cotización creada desde hoteles seleccionados.");
      setSelectedHotels([]);
      setShowQuoteBuilder(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function attachSelectedToPackage(payload: { packageId?: string; createPackageName?: string }) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (selectedHotels.length === 0) {
        throw new Error("No hay hoteles seleccionados para adjuntar.");
      }

      for (const offer of selectedHotels) {
        const response = await fetch("/api/admin/travel/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: payload.packageId,
            createPackageName: payload.createPackageName,
            destination: offer.address,
            offerType: "hotel",
            offer
          })
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(result.message ?? "No se pudo adjuntar hotel a paquete");
        }
      }

      const refresh = await fetch("/api/admin/travel/packages", { cache: "no-store" });
      const packagePayload = (await refresh.json()) as { packages?: TravelPackage[] };
      if (refresh.ok && packagePayload.packages) {
        setPackages(packagePayload.packages);
      }

      setMessage("Hoteles adjuntados al paquete correctamente.");
      setSelectedHotels([]);
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="travel-workspace-grid">
      <div className="stack-grid">
        <TravelSearchHeader
          title="Hotels Desk"
          subtitle="Busca hoteles por destino, políticas y amenities. Guarda opciones y genera cotizaciones."
          providers={providers}
        />
        <HotelSearchForm onSubmit={handleSearch} loading={loading} />
        <HotelResultsGrid offers={offers} onSelect={upsertSelected} onSave={saveSingleHotelQuote} onCompare={addCompare} />

        {showQuoteBuilder ? (
          <QuoteBuilderForm
            selectedFlights={[]}
            selectedHotels={selectedHotels}
            onSubmit={createQuoteFromSelection}
            loading={saving}
          />
        ) : null}

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>

      <SelectedTripSidebar
        selectedFlights={[]}
        selectedHotels={selectedHotels}
        packages={packages}
        onRemoveFlight={() => undefined}
        onRemoveHotel={(offerId) => setSelectedHotels((current) => current.filter((item) => item.id !== offerId))}
        onCreateQuote={() => setShowQuoteBuilder(true)}
        onAttachSelected={attachSelectedToPackage}
      />

      <TravelCompareDrawer
        open={showCompare}
        flights={[]}
        hotels={compareHotels}
        onClose={() => {
          setShowCompare(false);
          setCompareHotels([]);
        }}
      />
    </section>
  );
}
