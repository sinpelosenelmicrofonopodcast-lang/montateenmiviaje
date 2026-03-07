"use client";

interface TravelFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  helper?: string;
}

export function TravelFiltersBar({ search, onSearchChange, helper }: TravelFiltersBarProps) {
  return (
    <section className="card">
      <div className="table-head-row">
        <div>
          <label>
            Buscar
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Filtrar por destino, cliente, proveedor..."
            />
          </label>
        </div>
        {helper ? <p className="right-info">{helper}</p> : null}
      </div>
    </section>
  );
}
