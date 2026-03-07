"use client";

import { useState } from "react";
import type { FlightSearchInput } from "@/lib/travel/types";

interface FlightSearchFormProps {
  onSubmit: (input: FlightSearchInput) => Promise<void> | void;
  loading?: boolean;
}

export function FlightSearchForm({ onSubmit, loading }: FlightSearchFormProps) {
  const [form, setForm] = useState({
    origin: "MIA",
    destination: "DXB",
    departureDate: "",
    returnDate: "",
    oneWay: false,
    adults: 2,
    children: 0,
    infants: 0,
    cabinClass: "economy" as FlightSearchInput["cabinClass"],
    includeBags: true,
    directOnly: false,
    airline: "",
    minPrice: "",
    maxPrice: "",
    currency: "USD" as FlightSearchInput["currency"],
    flexibleDates: false
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: FlightSearchInput = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departureDate: form.departureDate,
      returnDate: form.oneWay ? undefined : form.returnDate || undefined,
      oneWay: form.oneWay,
      adults: Number(form.adults),
      children: Number(form.children),
      infants: Number(form.infants),
      cabinClass: form.cabinClass,
      includeBags: form.includeBags,
      directOnly: form.directOnly,
      airline: form.airline.trim() || undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      currency: form.currency,
      flexibleDates: form.flexibleDates
    };
    await onSubmit(payload);
  }

  return (
    <form className="card request-grid" onSubmit={handleSubmit}>
      <h3 className="request-full">Buscador interno de vuelos</h3>
      <label>
        Origen
        <input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} required />
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
        Fecha ida
        <input
          type="date"
          value={form.departureDate}
          onChange={(event) => setForm({ ...form, departureDate: event.target.value })}
          required
        />
      </label>
      <label>
        Fecha regreso
        <input
          type="date"
          value={form.returnDate}
          onChange={(event) => setForm({ ...form, returnDate: event.target.value })}
          disabled={form.oneWay}
        />
      </label>
      <label>
        Adultos
        <input
          type="number"
          min={1}
          max={9}
          value={form.adults}
          onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })}
        />
      </label>
      <label>
        Niños
        <input
          type="number"
          min={0}
          max={9}
          value={form.children}
          onChange={(event) => setForm({ ...form, children: Number(event.target.value) })}
        />
      </label>
      <label>
        Infantes
        <input
          type="number"
          min={0}
          max={4}
          value={form.infants}
          onChange={(event) => setForm({ ...form, infants: Number(event.target.value) })}
        />
      </label>
      <label>
        Clase
        <select
          value={form.cabinClass}
          onChange={(event) => setForm({ ...form, cabinClass: event.target.value as FlightSearchInput["cabinClass"] })}
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </label>
      <label>
        Aerolínea (opcional)
        <input value={form.airline} onChange={(event) => setForm({ ...form, airline: event.target.value })} />
      </label>
      <label>
        Precio mínimo
        <input value={form.minPrice} onChange={(event) => setForm({ ...form, minPrice: event.target.value })} />
      </label>
      <label>
        Precio máximo
        <input value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: event.target.value })} />
      </label>
      <label>
        Moneda
        <select
          value={form.currency}
          onChange={(event) => setForm({ ...form, currency: event.target.value as FlightSearchInput["currency"] })}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
          <option value="MXN">MXN</option>
        </select>
      </label>
      <label>
        <span>Solo ida</span>
        <input
          type="checkbox"
          checked={form.oneWay}
          onChange={(event) => setForm({ ...form, oneWay: event.target.checked })}
        />
      </label>
      <label>
        <span>Solo directos</span>
        <input
          type="checkbox"
          checked={form.directOnly}
          onChange={(event) => setForm({ ...form, directOnly: event.target.checked })}
        />
      </label>
      <label>
        <span>Maletas incluidas</span>
        <input
          type="checkbox"
          checked={form.includeBags}
          onChange={(event) => setForm({ ...form, includeBags: event.target.checked })}
        />
      </label>
      <label>
        <span>Búsqueda flexible</span>
        <input
          type="checkbox"
          checked={form.flexibleDates}
          onChange={(event) => setForm({ ...form, flexibleDates: event.target.checked })}
        />
      </label>
      <button className="button-dark request-full" type="submit" disabled={Boolean(loading)}>
        {loading ? "Buscando..." : "Buscar vuelos"}
      </button>
    </form>
  );
}
