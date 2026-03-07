import type { NormalizedHotelOffer } from "@/lib/travel/types";
import { toPublicImageSrc } from "@/lib/image-url";

interface HotelResultsGridProps {
  offers: NormalizedHotelOffer[];
  onSelect: (offer: NormalizedHotelOffer) => void;
  onCompare: (offer: NormalizedHotelOffer) => void;
  onSave: (offer: NormalizedHotelOffer) => void;
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

export function HotelResultsGrid({ offers, onSelect, onCompare, onSave }: HotelResultsGridProps) {
  if (offers.length === 0) {
    return (
      <section className="card">
        <h3>Resultados hoteles</h3>
        <p className="muted">Aún no hay resultados. Realiza una búsqueda para continuar.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>Resultados hoteles</h3>
      <div className="trip-grid" style={{ marginTop: "12px" }}>
        {offers.map((offer) => (
          <article key={offer.id} className="trip-card">
            {offer.mainImage ? (
              <img
                src={toPublicImageSrc(offer.mainImage)}
                alt={offer.hotelName}
                className="trip-card-image"
                loading="lazy"
              />
            ) : null}
            <div className="trip-card-content">
              <p className="chip">{offer.stars} estrellas</p>
              <h3>{offer.hotelName}</h3>
              <p>{offer.address}</p>
              <p className="muted">
                Rating: {offer.rating ?? "N/A"} · Habitación: {offer.roomType}
              </p>
              <p className="muted">
                Meal: {offer.mealPlan ?? "N/A"} · Cancelación: {offer.cancellationPolicy ?? "N/A"}
              </p>
              <p className="muted">Proveedor: {offer.provider}</p>
              <p>
                Noche: <strong>{formatMoney(offer.pricePerNight, offer.currency)}</strong>
              </p>
              <p>
                Taxes: {formatMoney(offer.taxes, offer.currency)} · Total:{" "}
                <strong>{formatMoney(offer.totalPrice, offer.currency)}</strong>
              </p>
              <div className="button-row">
                <button type="button" className="button-outline" onClick={() => onSelect(offer)}>
                  Seleccionar
                </button>
                <button type="button" className="button-outline" onClick={() => onSave(offer)}>
                  Guardar
                </button>
                <button type="button" className="button-dark" onClick={() => onCompare(offer)}>
                  Comparar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
