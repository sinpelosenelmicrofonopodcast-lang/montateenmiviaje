"use client";

import { useState } from "react";
import type { NormalizedFlightOffer, NormalizedHotelOffer, TravelPackage } from "@/lib/travel/types";

interface SelectedTripSidebarProps {
  selectedFlights: NormalizedFlightOffer[];
  selectedHotels: NormalizedHotelOffer[];
  packages: TravelPackage[];
  onRemoveFlight: (offerId: string) => void;
  onRemoveHotel: (offerId: string) => void;
  onCreateQuote: () => void;
  onAttachSelected: (payload: { packageId?: string; createPackageName?: string }) => Promise<void> | void;
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

export function SelectedTripSidebar({
  selectedFlights,
  selectedHotels,
  packages,
  onRemoveFlight,
  onRemoveHotel,
  onCreateQuote,
  onAttachSelected
}: SelectedTripSidebarProps) {
  const [packageId, setPackageId] = useState("");
  const [newPackageName, setNewPackageName] = useState("");
  const totalSelected = selectedFlights.length + selectedHotels.length;

  return (
    <aside className="card travel-sidebar-sticky">
      <h3>Selección activa</h3>
      <p className="muted">
        {totalSelected} elemento(s) en selección para comparar, cotizar y adjuntar a paquete.
      </p>

      <div className="stack-grid" style={{ marginTop: "12px" }}>
        <article className="admin-card">
          <h4>Vuelos ({selectedFlights.length})</h4>
          {selectedFlights.length === 0 ? (
            <p className="muted">Sin vuelos seleccionados.</p>
          ) : (
            <ul>
              {selectedFlights.map((offer) => (
                <li key={offer.id} style={{ marginBottom: "10px" }}>
                  {offer.airline} {offer.flightNumber} · {formatMoney(offer.totalPrice, offer.currency)}
                  <br />
                  <button type="button" className="button-outline" onClick={() => onRemoveFlight(offer.id)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-card">
          <h4>Hoteles ({selectedHotels.length})</h4>
          {selectedHotels.length === 0 ? (
            <p className="muted">Sin hoteles seleccionados.</p>
          ) : (
            <ul>
              {selectedHotels.map((offer) => (
                <li key={offer.id} style={{ marginBottom: "10px" }}>
                  {offer.hotelName} · {formatMoney(offer.totalPrice, offer.currency)}
                  <br />
                  <button type="button" className="button-outline" onClick={() => onRemoveHotel(offer.id)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="stack-grid" style={{ marginTop: "14px" }}>
        <button type="button" className="button-dark" onClick={onCreateQuote} disabled={totalSelected === 0}>
          Crear cotización desde selección
        </button>
        <label>
          Adjuntar a paquete existente
          <select value={packageId} onChange={(event) => setPackageId(event.target.value)}>
            <option value="">Selecciona paquete</option>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.packageName}
              </option>
            ))}
          </select>
        </label>
        <label>
          O crear paquete nuevo
          <input
            value={newPackageName}
            onChange={(event) => setNewPackageName(event.target.value)}
            placeholder="Ej. Dubai Signature Travel Ops"
          />
        </label>
        <button
          type="button"
          className="button-outline"
          disabled={totalSelected === 0 || (!packageId && newPackageName.trim().length < 3)}
          onClick={() => onAttachSelected({ packageId: packageId || undefined, createPackageName: newPackageName || undefined })}
        >
          Attach to Package
        </button>
      </div>
    </aside>
  );
}
