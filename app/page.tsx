import Link from "next/link";
import { TripCard } from "@/components/trip-card";
import { testimonials, trips } from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      <section className="hero container">
        <div className="hero-shell">
          <div>
            <p className="chip">Premium Group Travel</p>
            <h1>Viajes grupales premium con estética editorial.</h1>
            <p>
              Plataforma integral para explorar viajes, reservar cupos y gestionar pagos con PayPal
              desde una experiencia elegante y minimalista.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/viajes">
                Explorar viajes
              </Link>
              <Link className="button-outline" href="/sorteos">
                Ver sorteos
              </Link>
              <Link className="button-outline" href="/solicitar-viaje">
                Quiero viaje a medida
              </Link>
              <Link className="button-outline" href="/about">
                Conocer marca
              </Link>
            </div>
          </div>
          <div className="stats">
            <article className="stat-card">
              <h3>+42</h3>
              <p>Experiencias internacionales operadas</p>
            </article>
            <article className="stat-card">
              <h3>95%</h3>
              <p>Clientes recomiendan la experiencia</p>
            </article>
            <article className="stat-card">
              <h3>24h</h3>
              <p>Tiempo de respuesta concierge promedio</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <h2>Viajes destacados</h2>
          <Link href="/viajes" className="button-outline">
            Ver todos
          </Link>
        </div>
        <div className="trip-grid">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <h2>Testimonios verificados</h2>
        </div>
        <div className="trip-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="card">
              <p className="chip">{testimonial.verified ? "Verificado" : "Pendiente"}</p>
              <h3>{testimonial.customerName}</h3>
              <p>{testimonial.quote}</p>
              <p className="muted">{testimonial.tripTitle}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
