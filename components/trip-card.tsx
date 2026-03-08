import Image from "next/image";
import Link from "next/link";
import { Trip } from "@/lib/types";
import { availabilityPercent, formatDateRange, formatMoney, getStartingPrice } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const safeImageSrc = toPublicImageSrc(trip.heroImage);
  const lowestPrice = getStartingPrice(trip.packages, trip.priceFrom);
  const availability = availabilityPercent(trip.availableSpots, trip.totalSpots);

  return (
    <article className="trip-card">
      <Image
        src={safeImageSrc}
        alt={trip.title}
        width={1200}
        height={800}
        className="trip-card-image"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        decoding="async"
        unoptimized
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
