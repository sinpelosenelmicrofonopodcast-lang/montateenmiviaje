import type { NormalizedFlightOffer } from "@/lib/travel/types";

interface FlightResultsTableProps {
  offers: NormalizedFlightOffer[];
  onSelect: (offer: NormalizedFlightOffer) => void;
  onCompare: (offer: NormalizedFlightOffer) => void;
  onSave: (offer: NormalizedFlightOffer) => void;
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

export function FlightResultsTable({ offers, onSelect, onCompare, onSave }: FlightResultsTableProps) {
  if (offers.length === 0) {
    return (
      <section className="card">
        <h3>Resultados vuelos</h3>
        <p className="muted">No hay resultados todavía. Ejecuta una búsqueda para comparar opciones.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>Resultados vuelos</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Aerolínea</th>
              <th>Vuelo</th>
              <th>Horarios</th>
              <th>Duración</th>
              <th>Escalas</th>
              <th>Equipaje</th>
              <th>Proveedor</th>
              <th>Base</th>
              <th>Taxes</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.airline}</td>
                <td>{offer.flightNumber}</td>
                <td>
                  {new Date(offer.departureAt).toLocaleString("es-ES")} <br />
                  {new Date(offer.arrivalAt).toLocaleString("es-ES")}
                </td>
                <td>{offer.durationMinutes} min</td>
                <td>{offer.stops}</td>
                <td>{offer.baggage ?? "N/A"}</td>
                <td>{offer.provider}</td>
                <td>{formatMoney(offer.basePrice, offer.currency)}</td>
                <td>{formatMoney(offer.taxes, offer.currency)}</td>
                <td>
                  <strong>{formatMoney(offer.totalPrice, offer.currency)}</strong>
                </td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
