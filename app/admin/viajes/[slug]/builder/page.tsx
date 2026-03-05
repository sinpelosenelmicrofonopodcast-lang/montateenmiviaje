import { notFound } from "next/navigation";
import { getTripBySlug } from "@/lib/data";
import { formatMoney } from "@/lib/format";

interface BuilderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TripBuilderPage({ params }: BuilderPageProps) {
  const { slug } = await params;
  const trip = getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Package Builder</p>
        <h1>{trip.title}</h1>
        <p className="section-subtitle">Core feature: construcción dinámica de paquete, itinerario y pricing.</p>
      </header>

      <section className="card">
        <div className="builder-grid">
          <label>
            Destino
            <input defaultValue={trip.destination} />
          </label>
          <label>
            Fecha inicio
            <input type="date" defaultValue={trip.startDate} />
          </label>
          <label>
            Fecha fin
            <input type="date" defaultValue={trip.endDate} />
          </label>
          <label>
            Cupos
            <input type="number" defaultValue={trip.totalSpots} />
          </label>
          <label>
            Categoría
            <select defaultValue={trip.category}>
              <option value="Luxury">Luxury</option>
              <option value="Adventure">Adventure</option>
              <option value="Family">Family</option>
              <option value="Romantic">Romantic</option>
              <option value="Budget">Budget</option>
            </select>
          </label>
        </div>

        <h3>Paquetes</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Habitación</th>
                <th>Precio por persona</th>
                <th>Depósito</th>
                <th>Plan de pago</th>
              </tr>
            </thead>
            <tbody>
              {trip.packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>{pkg.roomType}</td>
                  <td>{formatMoney(pkg.pricePerPerson)}</td>
                  <td>{formatMoney(pkg.deposit)}</td>
                  <td>{pkg.paymentPlan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Itinerario por días</h3>
        {trip.itinerary.map((day) => (
          <article key={day.dayNumber} className="itinerary-item">
            <strong>Día {day.dayNumber}: {day.title}</strong>
            <p>{day.description}</p>
          </article>
        ))}

        <h3>Incluye / No incluye</h3>
        <div className="builder-cols">
          <ul>
            {trip.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ul>
            {trip.excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="button-row">
          <button className="button-dark" type="button">Publicar</button>
          <button className="button-outline" type="button">Despublicar</button>
          <button className="button-outline" type="button">Duplicar paquete</button>
          <button className="button-outline" type="button">Clonar itinerario</button>
          <button className="button-outline" type="button">Lista de espera</button>
          <button className="button-outline" type="button">Códigos descuento</button>
          <a className="button-primary" href={`/api/pdf/trip/${trip.slug}?audience=client&lang=es&showPrices=true`}>
            Generar PDF del paquete
          </a>
        </div>
      </section>
    </main>
  );
}
