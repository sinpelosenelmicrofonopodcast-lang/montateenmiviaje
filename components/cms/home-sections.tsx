import Link from "next/link";
import { Offer, Testimonial, Trip } from "@/lib/types";
import { PageSection } from "@/lib/cms-service";
import { TripCard } from "@/components/trip-card";
import { formatMoney } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";

interface HomeSectionsProps {
  sections: PageSection[];
  trips: Trip[];
  offers: Offer[];
  testimonials: Testimonial[];
  preview?: boolean;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function renderBenefits(section: PageSection) {
  const items = asArray(asRecord(section.content).items)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.title));

  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "Beneficios"}</h2>
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
      <div className="trip-grid" style={{ marginTop: "16px" }}>
        {items.map((item, index) => (
          <article key={`${section.id}-${index}`} className="card">
            <h3>{asString(item.title)}</h3>
            <p>{asString(item.description)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderHowItWorks(section: PageSection) {
  const steps = asArray(asRecord(section.content).steps)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.title));

  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "Cómo funciona"}</h2>
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
      <div className="stack-grid" style={{ marginTop: "16px" }}>
        {steps.map((step, index) => (
          <article key={`${section.id}-${index}`} className="card">
            <p className="chip">Paso {index + 1}</p>
            <h3>{asString(step.title)}</h3>
            <p>{asString(step.description)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderFeaturedTrips(section: PageSection, trips: Trip[]) {
  const limit = Math.max(1, asNumber(asRecord(section.content).limit, 6));
  const selected = trips.slice(0, limit);

  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "Viajes destacados"}</h2>
        {section.ctaLabel && section.ctaHref ? (
          <Link href={section.ctaHref} className="button-outline">
            {section.ctaLabel}
          </Link>
        ) : null}
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}

      <div className="trip-grid" style={{ marginTop: "16px" }}>
        {selected.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  );
}

function renderOffers(section: PageSection, offers: Offer[]) {
  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "Ofertas"}</h2>
        {section.ctaLabel && section.ctaHref ? (
          <Link href={section.ctaHref} className="button-outline">
            {section.ctaLabel}
          </Link>
        ) : null}
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}

      <div className="trip-grid" style={{ marginTop: "16px" }}>
        {offers.slice(0, 6).map((offer) => (
          <article key={offer.id} className="card">
            <p className="chip">{offer.discountType === "percent" ? "Descuento %" : "Descuento fijo"}</p>
            <h3>{offer.title}</h3>
            {offer.imageUrl ? <img src={toPublicImageSrc(offer.imageUrl)} alt={offer.title} className="trip-card-image" /> : null}
            <p>{offer.description}</p>
            <p>
              Código: <strong>{offer.code}</strong>
            </p>
            <p>
              Valor: <strong>{offer.discountType === "percent" ? `${offer.value}%` : formatMoney(offer.value)}</strong>
            </p>
            {offer.ctaLabel && offer.ctaHref ? (
              <Link href={offer.ctaHref} className="button-outline">
                {offer.ctaLabel}
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function renderTestimonials(section: PageSection, testimonials: Testimonial[]) {
  const limit = Math.max(1, asNumber(asRecord(section.content).limit, 6));
  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "Testimonios"}</h2>
        {section.ctaLabel && section.ctaHref ? (
          <Link href={section.ctaHref} className="button-outline">
            {section.ctaLabel}
          </Link>
        ) : null}
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
      <div className="trip-grid" style={{ marginTop: "16px" }}>
        {testimonials.slice(0, limit).map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "Pendiente"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
            {testimonial.city ? <p className="muted">{testimonial.city}</p> : null}
            <p className="muted">Rating: {testimonial.rating}/5</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderFaq(section: PageSection) {
  const items = asArray(asRecord(section.content).items)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.q));

  return (
    <section key={section.id} className="section container">
      <div className="section-heading">
        <h2>{section.title || "FAQ"}</h2>
      </div>
      {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
      <div className="stack-grid" style={{ marginTop: "16px" }}>
        {items.map((item, index) => (
          <article key={`${section.id}-${index}`} className="card">
            <h3>{asString(item.q)}</h3>
            <p>{asString(item.a)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderFinalCta(section: PageSection) {
  const content = asRecord(section.content);
  const secondaryLabel = asString(content.secondaryCtaLabel);
  const secondaryHref = asString(content.secondaryCtaHref);

  return (
    <section key={section.id} className="section container">
      <article className="card" style={{ padding: "32px" }}>
        {section.badge ? <p className="chip">{section.badge}</p> : null}
        <h2>{section.title || "Listo para viajar"}</h2>
        {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}
        <div className="hero-actions" style={{ marginTop: "16px" }}>
          {section.ctaLabel && section.ctaHref ? (
            <Link href={section.ctaHref} className="button-primary">
              {section.ctaLabel}
            </Link>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Link href={secondaryHref} className="button-outline">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function renderHero(section: PageSection) {
  const content = asRecord(section.content);
  const statCards = asArray(content.statCards).map((item) => asRecord(item));
  const badges = asArray(content.badges).map((item) => asString(item)).filter(Boolean);
  const secondaryCtaLabel = asString(content.secondaryCtaLabel);
  const secondaryCtaHref = asString(content.secondaryCtaHref);
  const backgroundImage = section.imageUrl || asString(content.backgroundImage);
  const fallbackSunsetImage =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80";
  const heroBackground = backgroundImage || fallbackSunsetImage;
  const backgroundImageUrl = backgroundImage ? toPublicImageSrc(backgroundImage) : "";
  const shellStyle = {
    backgroundImage: `linear-gradient(120deg, rgba(15, 12, 20, 0.58), rgba(63, 25, 10, 0.35), rgba(210, 124, 59, 0.22)), url("${
      backgroundImage ? backgroundImageUrl : heroBackground
    }")`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
  const heroTitle = section.title || "El mundo es grande... tu próxima aventura empieza aquí.";
  const heroSubtitle = section.subtitle || "Vuelos, hoteles y experiencias inolvidables en un solo lugar.";
  const primaryCtaLabel = section.ctaLabel || "Buscar mi viaje";
  const primaryCtaHref = section.ctaHref || "/viajes";

  return (
    <section key={section.id} className="hero container">
      <div className="hero-shell" style={shellStyle}>
        <img src="/logo.png" alt="Móntate en mi viaje" className="hero-overlay-globe" />
        <div className="hero-copy">
          <p className="chip">{section.badge || "Premium Travel"}</p>
          {badges.length > 0 ? (
            <div className="tag-row">
              {badges.map((badge, index) => (
                <span key={`${section.id}-badge-${index}`} className="chip">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          <h1>{heroTitle}</h1>
          <p className="hero-subtitle">{heroSubtitle}</p>
          <div className="hero-actions">
            <Link className="button-primary hero-cta" href={primaryCtaHref}>
              {primaryCtaLabel}
            </Link>
            {secondaryCtaLabel && secondaryCtaHref ? (
              <Link className="button-outline" href={secondaryCtaHref}>
                {secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>
        {statCards.length > 0 ? (
          <div className="stats">
            {statCards.map((card, index) => (
              <article className="stat-card" key={`${section.id}-stat-${index}`}>
                <h3>{asString(card.value)}</h3>
                <p>{asString(card.label)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function HomeSectionsRenderer({ sections, trips, offers, testimonials, preview }: HomeSectionsProps) {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {preview ? <p className="chip">Preview CMS Home</p> : null}
      {sorted.map((section) => {
        switch (section.sectionType) {
          case "hero":
            return renderHero(section);
          case "benefits":
            return renderBenefits(section);
          case "how_it_works":
            return renderHowItWorks(section);
          case "featured_trips":
            return renderFeaturedTrips(section, trips);
          case "offers_banner":
            return renderOffers(section, offers);
          case "testimonials":
            return renderTestimonials(section, testimonials);
          case "faq":
            return renderFaq(section);
          case "final_cta":
            return renderFinalCta(section);
          default:
            return (
              <section key={section.id} className="section container">
                <article className="card">
                  <p className="chip">{section.sectionType}</p>
                  <h3>{section.title || section.sectionKey}</h3>
                  {section.subtitle ? <p>{section.subtitle}</p> : null}
                  {section.ctaLabel && section.ctaHref ? (
                    <Link className="button-outline" href={section.ctaHref}>
                      {section.ctaLabel}
                    </Link>
                  ) : null}
                </article>
              </section>
            );
        }
      })}
    </>
  );
}
