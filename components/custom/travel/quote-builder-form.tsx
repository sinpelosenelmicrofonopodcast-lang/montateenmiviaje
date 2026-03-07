"use client";

import { useMemo, useState } from "react";
import type {
  CreateTravelQuoteInput,
  NormalizedFlightOffer,
  NormalizedHotelOffer
} from "@/lib/travel/types";

interface QuoteBuilderFormProps {
  selectedFlights: NormalizedFlightOffer[];
  selectedHotels: NormalizedHotelOffer[];
  onSubmit: (input: CreateTravelQuoteInput) => Promise<void> | void;
  loading?: boolean;
}

export function QuoteBuilderForm({ selectedFlights, selectedHotels, onSubmit, loading }: QuoteBuilderFormProps) {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    currency: "USD",
    feesTotal: "0",
    markupTotal: "0",
    discountTotal: "0",
    notesInternal: "",
    notesClient: "",
    expiresAt: ""
  });

  const items = useMemo(() => {
    const flightItems = selectedFlights.map((offer) => ({
      itemType: "flight" as const,
      providerName: offer.provider,
      externalOfferId: offer.id,
      title: `${offer.airline} ${offer.flightNumber} ${offer.originAirport}-${offer.destinationAirport}`,
      summary: {
        airline: offer.airline,
        flightNumber: offer.flightNumber,
        departureAt: offer.departureAt,
        arrivalAt: offer.arrivalAt,
        stops: offer.stops,
        baggage: offer.baggage ?? ""
      },
      raw: typeof offer.raw === "object" && offer.raw ? (offer.raw as Record<string, unknown>) : {},
      basePrice: offer.basePrice,
      taxes: offer.taxes
    }));
    const hotelItems = selectedHotels.map((offer) => ({
      itemType: "hotel" as const,
      providerName: offer.provider,
      externalOfferId: offer.id,
      title: offer.hotelName,
      summary: {
        hotelName: offer.hotelName,
        stars: offer.stars,
        roomType: offer.roomType,
        cancellationPolicy: offer.cancellationPolicy ?? ""
      },
      raw: typeof offer.raw === "object" && offer.raw ? (offer.raw as Record<string, unknown>) : {},
      basePrice: offer.totalPrice - offer.taxes,
      taxes: offer.taxes
    }));
    return [...flightItems, ...hotelItems];
  }, [selectedFlights, selectedHotels]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    await onSubmit({
      clientName: form.clientName.trim() || undefined,
      clientEmail: form.clientEmail.trim() || undefined,
      destination: form.destination.trim() || "Destino por definir",
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      currency: form.currency,
      feesTotal: Number(form.feesTotal || "0"),
      markupTotal: Number(form.markupTotal || "0"),
      discountTotal: Number(form.discountTotal || "0"),
      notesInternal: form.notesInternal.trim() || undefined,
      notesClient: form.notesClient.trim() || undefined,
      expiresAt: form.expiresAt || undefined,
      items
    });
  }

  return (
    <form className="card request-grid" onSubmit={handleSubmit}>
      <h3 className="request-full">Quote Builder / Cotizador</h3>
      <p className="request-full muted">
        Items conectados: {items.length}. Define fees/markup/discount, notas internas y datos de cliente.
      </p>
      <label>
        Cliente
        <input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} />
      </label>
      <label>
        Email cliente
        <input
          type="email"
          value={form.clientEmail}
          onChange={(event) => setForm({ ...form, clientEmail: event.target.value })}
        />
      </label>
      <label>
        Destino
        <input
          value={form.destination}
          onChange={(event) => setForm({ ...form, destination: event.target.value })}
          required
        />
      </label>
      <label>
        Fecha salida
        <input
          type="date"
          value={form.departureDate}
          onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
        />
      </label>
      <label>
        Fecha regreso
        <input
          type="date"
          value={form.returnDate}
          onChange={(event) => setForm({ ...form, returnDate: event.target.value })}
        />
      </label>
      <label>
        Moneda
        <select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
          <option value="MXN">MXN</option>
        </select>
      </label>
      <label>
        Fees manuales
        <input
          type="number"
          min={0}
          value={form.feesTotal}
          onChange={(event) => setForm({ ...form, feesTotal: event.target.value })}
        />
      </label>
      <label>
        Markup
        <input
          type="number"
          min={0}
          value={form.markupTotal}
          onChange={(event) => setForm({ ...form, markupTotal: event.target.value })}
        />
      </label>
      <label>
        Descuento
        <input
          type="number"
          min={0}
          value={form.discountTotal}
          onChange={(event) => setForm({ ...form, discountTotal: event.target.value })}
        />
      </label>
      <label>
        Expira
        <input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
      </label>
      <label className="request-full">
        Notas internas
        <textarea
          rows={3}
          value={form.notesInternal}
          onChange={(event) => setForm({ ...form, notesInternal: event.target.value })}
        />
      </label>
      <label className="request-full">
        Notas visibles cliente
        <textarea
          rows={3}
          value={form.notesClient}
          onChange={(event) => setForm({ ...form, notesClient: event.target.value })}
        />
      </label>
      <button type="submit" className="button-dark request-full" disabled={Boolean(loading) || items.length === 0}>
        {loading ? "Guardando..." : "Guardar cotización"}
      </button>
    </form>
  );
}
