"use client";

import { useState } from "react";
import type { HotelSearchInput } from "@/lib/travel/types";

interface HotelSearchFormProps {
  onSubmit: (input: HotelSearchInput) => Promise<void> | void;
  loading?: boolean;
}

export function HotelSearchForm({ onSubmit, loading }: HotelSearchFormProps) {
  const [form, setForm] = useState({
    destination: "Dubai",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    rooms: 1,
    hotelName: "",
    stars: "",
    minPrice: "",
    maxPrice: "",
    amenities: "",
    neighborhood: "",
    flexibleCancellation: true,
    breakfastIncluded: false,
    currency: "USD" as HotelSearchInput["currency"]
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: HotelSearchInput = {
      destination: form.destination.trim(),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults),
      children: Number(form.children),
      rooms: Number(form.rooms),
      hotelName: form.hotelName.trim() || undefined,
      stars: form.stars ? Number(form.stars) : undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      neighborhood: form.neighborhood.trim() || undefined,
      flexibleCancellation: form.flexibleCancellation,
      breakfastIncluded: form.breakfastIncluded,
      currency: form.currency
    };
    await onSubmit(payload);
  }

  return (
    <form className="card request-grid" onSubmit={handleSubmit}>
      <h3 className="request-full">Buscador interno de hoteles</h3>
      <label>
        Ciudad / destino
        <input
          value={form.destination}
          onChange={(event) => setForm({ ...form, destination: event.target.value })}
          required
        />
      </label>
      <label>
        Check-in
        <input
          type="date"
          value={form.checkIn}
          onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
          required
        />
      </label>
      <label>
        Check-out
        <input
          type="date"
          value={form.checkOut}
          onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
          required
        />
      </label>
      <label>
        Adultos
        <input
          type="number"
          min={1}
          max={10}
          value={form.adults}
          onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })}
        />
      </label>
      <label>
        Niños
        <input
          type="number"
          min={0}
          max={10}
          value={form.children}
          onChange={(event) => setForm({ ...form, children: Number(event.target.value) })}
        />
      </label>
      <label>
        Habitaciones
        <input
          type="number"
          min={1}
          max={6}
          value={form.rooms}
          onChange={(event) => setForm({ ...form, rooms: Number(event.target.value) })}
        />
      </label>
      <label>
        Nombre hotel (opcional)
        <input value={form.hotelName} onChange={(event) => setForm({ ...form, hotelName: event.target.value })} />
      </label>
      <label>
        Estrellas mínimas
        <input
          type="number"
          min={1}
          max={5}
          value={form.stars}
          onChange={(event) => setForm({ ...form, stars: event.target.value })}
        />
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
        Amenities (coma)
        <input value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
      </label>
      <label>
        Barrio / zona
        <input
          value={form.neighborhood}
          onChange={(event) => setForm({ ...form, neighborhood: event.target.value })}
        />
      </label>
      <label>
        Moneda
        <select
          value={form.currency}
          onChange={(event) => setForm({ ...form, currency: event.target.value as HotelSearchInput["currency"] })}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
          <option value="MXN">MXN</option>
        </select>
      </label>
      <label>
        <span>Cancelación flexible</span>
        <input
          type="checkbox"
          checked={form.flexibleCancellation}
          onChange={(event) => setForm({ ...form, flexibleCancellation: event.target.checked })}
        />
      </label>
      <label>
        <span>Desayuno incluido</span>
        <input
          type="checkbox"
          checked={form.breakfastIncluded}
          onChange={(event) => setForm({ ...form, breakfastIncluded: event.target.checked })}
        />
      </label>

      <button className="button-dark request-full" type="submit" disabled={Boolean(loading)}>
        {loading ? "Buscando..." : "Buscar hoteles"}
      </button>
    </form>
  );
}
