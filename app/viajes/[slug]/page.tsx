import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTripBySlug } from "@/lib/data";
import { availabilityPercent, formatDateRange, formatMoney } from "@/lib/format";

interface TripDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { slug } = await params;
  const trip = getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const availability = availabilityPercent(trip.availableSpots, trip.totalSpots);

  return (
    <main className="container section">
      <div className="trip-detail-shell">
        <section>
          <Image
            className="trip-detail-image"
            src={trip.heroImage}
            alt={trip.title}
            width={1200}
            height={800}
          />
          <h1>{trip.title}</h1>
          <p className="chip">{trip.category}</p>
          <p>{trip.summary}</p>
          <p>
            <strong>{trip.destination}</strong> · {formatDateRange(trip.startDate, trip.endDate)}
          </p>

          <div className="card">
            <h3>Itinerario</h3>
            {trip.itinerary.map((day) => (
              <article key={day.dayNumber} className="itinerary-item">
                <strong>
                  Día {day.dayNumber}: {day.title}
                </strong>
                <p>{day.description}</p>
              </article>
            ))}
          </div>

          <div className="card">
            <h3>Incluye</h3>
            <ul>
              {trip.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>No incluye</h3>
            <ul>
              {trip.excludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Add-ons opcionales</h3>
            <ul>
              {trip.addons.map((addon) => (
                <li key={addon.id}>
                  {addon.name} · {formatMoney(addon.price)}
                </li>
              ))}
            </ul>
            <h3>Mapa de itinerario</h3>
            <p className="muted">{trip.itinerary.map((day) => day.mapPin).filter(Boolean).join(" · ")}</p>
          </div>
        </section>

        <aside>
          <div className="card">
            <h3>Reserva</h3>
            <p>
              <strong>Desde {formatMoney(Math.min(...trip.packages.map((pkg) => pkg.pricePerPerson)))}</strong>
            </p>
            <p>
              Depósito desde {formatMoney(Math.min(...trip.packages.map((pkg) => pkg.deposit)))}
            </p>
            <div className="availability-row">
              <span>
                Cupos disponibles: {trip.availableSpots}/{trip.totalSpots}
              </span>
              <div className="availability-track" aria-hidden>
                <div className="availability-fill" style={{ width: `${availability}%` }} />
              </div>
            </div>
            <Link href={`/reservar/${trip.slug}`} className="button-primary" style={{ marginTop: "16px" }}>
              Reservar con PayPal
            </Link>
            <a
              href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}
              className="button-outline"
              style={{ marginTop: "12px" }}
            >
              Descargar brochure PDF
            </a>
          </div>

          <div className="card">
            <h3>Políticas</h3>
            <ul>
              {trip.policies.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Requisitos</h3>
            <ul>
              {trip.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Hoteles</h3>
            <ul>
              {trip.hotels?.map((hotel) => (
                <li key={hotel}>{hotel}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
