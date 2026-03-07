import Link from "next/link";
import { Trip } from "@/lib/types";
import { availabilityPercent, formatDateRange, formatMoney } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const safeImageSrc = toPublicImageSrc(trip.heroImage);
  const lowestPrice = trip.packages.length > 0
    ? Math.min(...trip.packages.map((pkg) => pkg.pricePerPerson))
    : null;
  const availability = availabilityPercent(trip.availableSpots, trip.totalSpots);

  return (
    <article className="trip-card">
      <img
        src={safeImageSrc}
        alt={trip.title}
        className="trip-card-image"
        loading="lazy"
        decoding="async"
      />
      <div className="trip-card-content">
        <p className="chip">{trip.category}</p>
        <h3>{trip.title}</h3>
        <p>{trip.destination}</p>
        <p>{formatDateRange(trip.startDate, trip.endDate)}</p>
        <div className="availability-row">
          <span>{trip.availableSpots} cupos</span>
          <div className="availability-track" aria-hidden>
            <div className="availability-fill" style={{ width: `${availability}%` }} />
          </div>
        </div>
        <div className="trip-card-footer">
          <strong>{lowestPrice ? `Desde ${formatMoney(lowestPrice)}` : "Precio próximamente"}</strong>
          <Link href={`/viajes/${trip.slug}`} className="button-outline">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
