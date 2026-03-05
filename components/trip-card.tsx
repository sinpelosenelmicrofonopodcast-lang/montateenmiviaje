import Image from "next/image";
import Link from "next/link";
import { Trip } from "@/lib/types";
import { availabilityPercent, formatDateRange, formatMoney } from "@/lib/format";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const lowestPrice = Math.min(...trip.packages.map((pkg) => pkg.pricePerPerson));
  const availability = availabilityPercent(trip.availableSpots, trip.totalSpots);

  return (
    <article className="trip-card">
      <Image
        src={trip.heroImage}
        alt={trip.title}
        className="trip-card-image"
        width={900}
        height={600}
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
          <strong>Desde {formatMoney(lowestPrice)}</strong>
          <Link href={`/viajes/${trip.slug}`} className="button-outline">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
