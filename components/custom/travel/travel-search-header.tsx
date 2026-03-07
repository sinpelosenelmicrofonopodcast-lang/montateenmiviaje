interface TravelSearchHeaderProps {
  title: string;
  subtitle: string;
  providers?: string[];
}

export function TravelSearchHeader({ title, subtitle, providers = [] }: TravelSearchHeaderProps) {
  return (
    <section className="card">
      <div className="table-head-row">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        {providers.length > 0 ? (
          <div className="right-info">
            <p>Fuentes activas</p>
            <p>{providers.join(" · ")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
