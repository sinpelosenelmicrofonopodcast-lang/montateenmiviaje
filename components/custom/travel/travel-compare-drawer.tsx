"use client";

import type { NormalizedFlightOffer, NormalizedHotelOffer } from "@/lib/travel/types";

interface TravelCompareDrawerProps {
  open: boolean;
  flights: NormalizedFlightOffer[];
  hotels: NormalizedHotelOffer[];
  onClose: () => void;
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

export function TravelCompareDrawer({ open, flights, hotels, onClose }: TravelCompareDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="travel-compare-drawer card">
      <div className="table-head-row">
        <div>
          <h3>Comparador</h3>
          <p className="muted">Comparación lado a lado de precio, duración y políticas.</p>
        </div>
        <button type="button" className="button-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {flights.length > 0 ? (
        <section className="section" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
          <h4>Vuelos seleccionados</h4>
          <div className="travel-compare-grid">
            {flights.map((flight) => (
              <article key={flight.id} className="admin-card">
                <h4>{flight.airline}</h4>
                <p>{flight.flightNumber}</p>
                <p>Duración: {flight.durationMinutes} min</p>
                <p>Escalas: {flight.stops}</p>
                <p>Equipaje: {flight.baggage ?? "N/A"}</p>
                <p>Proveedor: {flight.provider}</p>
                <p>
                  Total: <strong>{formatMoney(flight.totalPrice, flight.currency)}</strong>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hotels.length > 0 ? (
        <section className="section" style={{ paddingTop: "16px", paddingBottom: "0" }}>
          <h4>Hoteles seleccionados</h4>
          <div className="travel-compare-grid">
            {hotels.map((hotel) => (
              <article key={hotel.id} className="admin-card">
                <h4>{hotel.hotelName}</h4>
                <p>Estrellas: {hotel.stars} · Rating: {hotel.rating ?? "N/A"}</p>
                <p>Cancelación: {hotel.cancellationPolicy ?? "N/A"}</p>
                <p>Meal: {hotel.mealPlan ?? "N/A"}</p>
                <p>Proveedor: {hotel.provider}</p>
                <p>
                  Total: <strong>{formatMoney(hotel.totalPrice, hotel.currency)}</strong>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
