"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GalleryAlbumBundle } from "@/lib/catalog-service";
import { PageSection } from "@/lib/cms-service";
import { formatMoney, getStartingPrice } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";
import { Offer, Raffle, Testimonial, Trip } from "@/lib/types";
import type { RafflePublicSummary } from "@/lib/raffles-service";
import { TravelIcon, type TravelIconName } from "@/components/ui/travel-icons";
import styles from "./home-sections.module.css";

interface HomeSectionsProps {
  sections: PageSection[];
  trips: Trip[];
  offers: Offer[];
  testimonials: Testimonial[];
  raffles: Raffle[];
  galleryBundles: GalleryAlbumBundle[];
  featuredRaffleSummary?: RafflePublicSummary | null;
  preview?: boolean;
}

interface DiscoveryIntent {
  destination: string;
  month: string;
  travelers: string;
  budget: string;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function findSection(sections: PageSection[], sectionType: string) {
  return sections.find((section) => section.sectionType === sectionType);
}

function daysUntil(dateString: string) {
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-PR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getOfferBadge(offer: Offer) {
  if (!offer.endsAt) {
    return "Oferta exclusiva";
  }

  const days = Math.ceil((new Date(offer.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return "Cierra pronto";
  if (days <= 7) return "Ultima semana";
  return "Promocion activa";
}

function getTripFillPercent(trip: Trip) {
  if (!trip.totalSpots) return 0;
  const sold = Math.max(trip.totalSpots - trip.availableSpots, 0);
  return Math.max(Math.min(Math.round((sold / trip.totalSpots) * 100), 100), 0);
}

function getTripUrgencyLabel(trip: Trip) {
  if (trip.availableSpots <= 3) return "Ultimos espacios";
  if (trip.availableSpots <= 8) return "Se esta llenando";
  return "Reservas abiertas";
}

function toTravelIconName(value: string, fallback: TravelIconName = "spark"): TravelIconName {
  const icon = value.trim().toLowerCase() as TravelIconName;
  const allowed: TravelIconName[] = [
    "palm",
    "luggage",
    "plane",
    "shield",
    "wallet",
    "map",
    "spark",
    "clock",
    "users",
    "document",
    "message",
    "bell"
  ];

  return allowed.includes(icon) ? icon : fallback;
}

function formatCount(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Math.max(value, 0).toLocaleString("es-PR");
}

function buildGalleryMosaic(galleryBundles: GalleryAlbumBundle[]) {
  const urls = new Set<string>();
  const items: Array<{ url: string; caption: string }> = [];

  for (const bundle of galleryBundles) {
    const cover = toPublicImageSrc(bundle.album.coverImage);
    if (cover && !urls.has(cover)) {
      urls.add(cover);
      items.push({ url: cover, caption: bundle.album.title });
    }

    for (const media of bundle.media) {
      if (media.type !== "photo") continue;
      const mediaUrl = toPublicImageSrc(media.url);
      if (!mediaUrl || urls.has(mediaUrl)) continue;
      urls.add(mediaUrl);
      items.push({ url: mediaUrl, caption: media.caption || bundle.album.title });
      if (items.length >= 9) return items;
    }

    if (items.length >= 9) break;
  }

  return items;
}

function Reveal({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export function HomeSectionsRenderer({
  sections,
  trips,
  offers,
  testimonials,
  raffles,
  galleryBundles,
  featuredRaffleSummary,
  preview
}: HomeSectionsProps) {
  const router = useRouter();
  const [discovery, setDiscovery] = useState<DiscoveryIntent>({
    destination: "",
    month: "",
    travelers: "2",
    budget: ""
  });

  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroSection = findSection(sorted, "hero");
  const benefitsSection = findSection(sorted, "benefits");
  const finalCtaSection = findSection(sorted, "final_cta");
  const howItWorksSection = findSection(sorted, "how_it_works");

  const heroContent = asRecord(heroSection?.content);
  const heroBackground = toPublicImageSrc(
    heroSection?.imageUrl ||
      asString(heroContent.backgroundImage) ||
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2200&q=80"
  );

  const heroBadges = asArray(heroContent.badges)
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, 3);

  const heroTitle = heroSection?.title || "Viajes grupales premium sin estres, con acompanamiento real.";
  const heroSubtitle =
    heroSection?.subtitle ||
    "Curamos vuelos, hotel, experiencias y logistica para que solo te enfoques en vivir el viaje.";

  const primaryCta = {
    label: heroSection?.ctaLabel || "Explorar viajes",
    href: heroSection?.ctaHref || "/viajes"
  };

  const secondaryCta = {
    label: asString(heroContent.secondaryCtaLabel) || "Ver sorteos",
    href: asString(heroContent.secondaryCtaHref) || "/sorteos"
  };

  const tertiaryCta = {
    label: asString(heroContent.tertiaryCtaLabel) || "Planear mi viaje",
    href: asString(heroContent.tertiaryCtaHref) || "/solicitar-viaje"
  };

  const activeRaffles = raffles.filter((raffle) => raffle.status === "published");
  const highlightedRaffle = activeRaffles[0] ?? raffles[0] ?? null;
  const raffleSummary = featuredRaffleSummary ?? null;
  const raffleCountdownDays = highlightedRaffle ? daysUntil(highlightedRaffle.drawAt) : null;

  const destinationTrips = useMemo(() => trips.slice(0, 6), [trips]);
  const featuredOffers = useMemo(() => offers.slice(0, 4), [offers]);
  const featuredTestimonials = useMemo(() => testimonials.slice(0, 4), [testimonials]);
  const galleryItems = buildGalleryMosaic(galleryBundles);

  const upcomingTrips = useMemo(
    () =>
      [...trips]
        .filter((trip) => trip.publishStatus === "published")
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3),
    [trips]
  );

  const fillingTrips = useMemo(
    () =>
      [...trips]
        .sort((a, b) => getTripFillPercent(b) - getTripFillPercent(a))
        .slice(0, 3),
    [trips]
  );

  const benefitItems = asArray(asRecord(benefitsSection?.content).items)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.title));

  const howItems = asArray(asRecord(howItWorksSection?.content).items)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.title));

  const benefitCards =
    benefitItems.length > 0
      ? benefitItems.map((item) => ({
          title: asString(item.title),
          description: asString(item.description),
          icon: toTravelIconName(asString(item.icon), "spark")
        }))
      : [
          {
            title: "No pierdas tiempo planeando solo",
            description: "Consolidamos vuelo, hotel y experiencia para que reserves con claridad.",
            icon: "map" as TravelIconName
          },
          {
            title: "Reserva con deposito y paga por fases",
            description: "Estructura de pago flexible y acompanamiento en cada etapa.",
            icon: "wallet" as TravelIconName
          },
          {
            title: "Todo centralizado en un solo lugar",
            description: "Itinerarios, documentos y pagos disponibles desde tu portal.",
            icon: "document" as TravelIconName
          },
          {
            title: "Soporte humano por WhatsApp",
            description: "Equipo concierge antes, durante y despues del viaje.",
            icon: "message" as TravelIconName
          }
        ];

  const trustPills = [
    {
      title: "Pagos flexibles",
      description: "Reserva con deposito y completa en cuotas",
      icon: "wallet" as TravelIconName
    },
    {
      title: "Soporte por WhatsApp",
      description: "Acompanamiento antes y durante tu viaje",
      icon: "message" as TravelIconName
    },
    {
      title: "Itinerarios profesionales",
      description: "Documentacion clara y organizada",
      icon: "document" as TravelIconName
    },
    {
      title: "Viajes curados",
      description: "Destinos y experiencias seleccionadas",
      icon: "palm" as TravelIconName
    }
  ];

  const howCards = (
    howItems.length
      ? howItems.map((item) => ({
          title: asString(item.title),
          description: asString(item.description),
          icon: toTravelIconName(asString(item.icon), "spark")
        }))
      : [
          {
            title: "Escoge tu viaje",
            description: "Explora destinos, fechas y categorias segun tu estilo.",
            icon: "map" as TravelIconName
          },
          {
            title: "Reserva con deposito",
            description: "Asegura cupo y completa tu plan de pago con tranquilidad.",
            icon: "wallet" as TravelIconName
          },
          {
            title: "Recibe itinerario y soporte",
            description: "Te entregamos documentos y seguimiento por WhatsApp.",
            icon: "message" as TravelIconName
          }
        ]
  ).slice(0, 3);

  const utilityCards = [
    {
      title: "Invita y gana credito de viaje",
      description: "Comparte tu enlace y activa recompensas para tu proxima aventura.",
      href: "/portal/referidos",
      cta: "Ver programa de referidos",
      icon: "users" as TravelIconName
    },
    {
      title: "Recibe alertas exclusivas",
      description: "Enterate primero de salidas nuevas, ofertas premium y sorteos activos.",
      href: "/registro",
      cta: "Crear cuenta y activar alertas",
      icon: "bell" as TravelIconName
    }
  ];

  const finalCtaContent = asRecord(finalCtaSection?.content);
  const finalPrimaryLabel = finalCtaSection?.ctaLabel || "Planear mi viaje";
  const finalPrimaryHref = finalCtaSection?.ctaHref || "/solicitar-viaje";
  const finalSecondaryLabel = asString(finalCtaContent.secondaryCtaLabel) || "Ver viajes disponibles";
  const finalSecondaryHref = asString(finalCtaContent.secondaryCtaHref) || "/viajes";

  const raffleTotalNumbers = raffleSummary?.metrics.totalNumbers ?? highlightedRaffle?.numberPoolSize ?? 0;
  const raffleSoldNumbers = raffleSummary?.metrics.soldNumbers ?? 0;
  const raffleAvailableNumbers =
    raffleSummary?.metrics.availableNumbers ??
    Math.max((highlightedRaffle?.numberPoolSize ?? 0) - raffleSoldNumbers, 0);
  const raffleProgressPercent =
    raffleSummary?.metrics.progressPercent ??
    (raffleTotalNumbers > 0 ? Math.round((raffleSoldNumbers / raffleTotalNumbers) * 100) : 0);

  function handleDiscoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (discovery.destination.trim()) params.set("destination", discovery.destination.trim());
    if (discovery.month) params.set("month", discovery.month);
    if (discovery.travelers) params.set("travelers", discovery.travelers);
    if (discovery.budget.trim()) params.set("budget", discovery.budget.trim());

    const query = params.toString();
    router.push(query ? `/viajes?${query}` : "/viajes");
  }

  return (
    <div className={styles.homeRoot}>
      {preview ? <p className={`${styles.previewChip} chip`}>Preview CMS Home</p> : null}

      <section className={styles.heroWrap}>
        <div className="container">
          <Reveal className={styles.heroStage}>
            <div
              className={styles.heroBackdrop}
              style={{
                backgroundImage: `linear-gradient(120deg, rgba(7, 14, 26, 0.8), rgba(11, 34, 50, 0.6), rgba(170, 96, 58, 0.5)), url('${heroBackground}')`
              }}
            />
            <div className={styles.heroDecorLeft}>
              <TravelIcon name="palm" className={styles.heroDecorIcon} />
            </div>
            <div className={styles.heroDecorRight}>
              <TravelIcon name="luggage" className={styles.heroDecorIcon} />
            </div>

            <div className={styles.heroContent}>
              <p className={`${styles.heroBadge} chip`}>
                {heroSection?.badge || "Premium Group Travel"}
              </p>

              <div className={styles.badgeRow}>
                {(heroBadges.length
                  ? heroBadges
                  : ["Viajes grupales curados", "Ofertas y experiencias", "Sorteos activos"]
                ).map((badge) => (
                  <span key={badge} className={styles.badgePill}>
                    {badge}
                  </span>
                ))}
              </div>

              <h1 className={styles.heroTitle}>{heroTitle}</h1>
              <p className={styles.heroSubtitle}>{heroSubtitle}</p>

              <div className={styles.heroActions}>
                <Link className={styles.ctaPrimary} href={primaryCta.href}>
                  {primaryCta.label}
                </Link>
                <Link className={styles.ctaSecondary} href={secondaryCta.href}>
                  {secondaryCta.label}
                </Link>
                <Link className={styles.ctaGhost} href={tertiaryCta.href}>
                  {tertiaryCta.label}
                </Link>
              </div>
            </div>

            <form className={styles.discoveryBar} onSubmit={handleDiscoverySubmit}>
              <div className={styles.discoveryField}>
                <label>Destino</label>
                <input
                  placeholder="Ej: Dubai, Bali, Tailandia"
                  value={discovery.destination}
                  onChange={(event) => setDiscovery({ ...discovery, destination: event.target.value })}
                />
              </div>
              <div className={styles.discoveryField}>
                <label>Mes</label>
                <input
                  type="month"
                  value={discovery.month}
                  onChange={(event) => setDiscovery({ ...discovery, month: event.target.value })}
                />
              </div>
              <div className={styles.discoveryField}>
                <label>Personas</label>
                <select
                  value={discovery.travelers}
                  onChange={(event) => setDiscovery({ ...discovery, travelers: event.target.value })}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div className={styles.discoveryField}>
                <label>Presupuesto aprox.</label>
                <input
                  placeholder="Ej: 2500 USD"
                  value={discovery.budget}
                  onChange={(event) => setDiscovery({ ...discovery, budget: event.target.value })}
                />
              </div>
              <div className={styles.discoveryActions}>
                <button className={styles.discoveryPrimary} type="submit">
                  Buscar opciones
                </button>
                <Link className={styles.discoverySecondary} href="/solicitar-viaje">
                  Solicitud personalizada
                </Link>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      <section className={styles.trustStripSection}>
        <div className="container">
          <Reveal className={styles.trustStrip}>
            {trustPills.map((item) => (
              <article key={item.title} className={styles.trustItem}>
                <div className={styles.trustHead}>
                  <span className={styles.trustIconWrap}>
                    <TravelIcon name={item.icon} className={styles.trustIcon} />
                  </span>
                  <p className={styles.trustLabel}>{item.title}</p>
                </div>
                <p className={styles.trustHint}>{item.description}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Viajes grupales</p>
              <h2>Destinos curados para quienes quieren viajar con estilo y claridad</h2>
              <p>Selecciona la experiencia segun tu vibe: luxury, aventura, cultural o escapada de grupo.</p>
            </div>
          </Reveal>

          {destinationTrips.length > 0 ? (
            <div className={styles.destinationGrid}>
              {destinationTrips.map((trip, index) => {
                const fillPercent = getTripFillPercent(trip);
                const startingPrice = getStartingPrice(trip.packages, trip.priceFrom);
                return (
                  <Reveal key={trip.id} delay={index * 0.05}>
                    <Link href={`/viajes/${trip.slug}`} className={styles.destinationCard}>
                      <img src={toPublicImageSrc(trip.heroImage)} alt={trip.title} />
                      <div className={styles.destinationOverlay}>
                        <p className={styles.destinationCategory}>{trip.category}</p>
                        <h3>{trip.title}</h3>
                        <p>{trip.destination}</p>
                        <div className={styles.destinationMeta}>
                          <span>
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </span>
                          <span>{getTripUrgencyLabel(trip)}</span>
                        </div>
                        <p className={styles.destinationPrice}>
                          {startingPrice ? `Desde ${formatMoney(startingPrice)} p/p` : "Precio proximamente"}
                        </p>
                        <div className={styles.progressMini}>
                          <div style={{ width: `${fillPercent}%` }} />
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className={styles.utilityBand}>
              <article>
                <h3>Estamos publicando nuevas salidas</h3>
                <p>Recibe alertas de destinos y fechas apenas abrimos cupos.</p>
                <Link href="/registro">Activar alertas</Link>
              </article>
            </div>
          )}
        </div>
      </section>

      <section className={styles.sectionBlockAlt}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Ofertas y experiencias</p>
              <h2>Oportunidades limitadas para reservar con ventaja</h2>
              <p>Salidas proximas, grupos privados y promociones activas con enfoque premium.</p>
            </div>
          </Reveal>

          {featuredOffers.length > 0 ? (
            <div className={styles.offerGrid}>
              {featuredOffers.map((offer, index) => (
                <Reveal key={offer.id} delay={index * 0.06}>
                  <article className={styles.offerCard}>
                    {offer.imageUrl ? (
                      <img src={toPublicImageSrc(offer.imageUrl)} alt={offer.title} />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
                        alt={offer.title}
                      />
                    )}
                    <div className={styles.offerBody}>
                      <div className={styles.offerTags}>
                        <span className="chip">{getOfferBadge(offer)}</span>
                        <span className={styles.offerValue}>
                          {offer.discountType === "percent"
                            ? `-${offer.value}%`
                            : `${formatMoney(offer.value)} off`}
                        </span>
                      </div>
                      <h3>{offer.title}</h3>
                      <p>{offer.subtitle || offer.description}</p>
                      <Link href={offer.ctaHref || "/ofertas"}>{offer.ctaLabel || "Ver oferta"}</Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className={styles.utilityBand}>
              <article>
                <h3>Ofertas premium en actualizacion</h3>
                <p>Activa notificaciones para enterarte primero de promociones especiales.</p>
                <Link href="/ofertas">Explorar ofertas</Link>
              </article>
            </div>
          )}
        </div>
      </section>

      {highlightedRaffle ? (
        <section className={styles.sectionBlock}>
          <div className="container">
            <Reveal className={styles.raffleFeature}>
              <div>
                <p className="chip">Rifa destacada</p>
                <h2>{highlightedRaffle.title}</h2>
                <p>{highlightedRaffle.description}</p>
                <div className={styles.raffleMeta}>
                  <span>
                    {highlightedRaffle.isFree
                      ? "Entrada gratuita"
                      : `Entrada ${formatMoney(highlightedRaffle.entryFee)}`}
                  </span>
                  <span>
                    {raffleCountdownDays !== null ? `${raffleCountdownDays} dias restantes` : "Draw programado"}
                  </span>
                  <span>Premio: {highlightedRaffle.prize}</span>
                </div>
                <div className={styles.heroActions}>
                  <Link className={styles.ctaPrimary} href={`/sorteos/${highlightedRaffle.id}`}>
                    Participar ahora
                  </Link>
                  <a
                    className={styles.ctaSecondary}
                    href={`https://wa.me/?text=${encodeURIComponent(`Mira este sorteo en Móntate en mi viaje: https://www.montateenmiviaje.com/sorteos/${highlightedRaffle.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Compartir por WhatsApp
                  </a>
                </div>
              </div>

              <div className={styles.rafflePanel}>
                <div className={styles.raffleStatRow}>
                  <article>
                    <p className={styles.rafflePulseValue}>{formatCount(raffleSoldNumbers)}</p>
                    <p>Vendidos</p>
                  </article>
                  <article>
                    <p className={styles.rafflePulseValue}>{formatCount(raffleAvailableNumbers)}</p>
                    <p>Disponibles</p>
                  </article>
                </div>
                <div className={styles.raffleProgressTrack}>
                  <div style={{ width: `${raffleProgressPercent}%` }} />
                </div>
                <p className={styles.rafflePulseTag}>
                  {raffleSummary
                    ? `${raffleSummary.metrics.progressPercent}% del pool comprometido`
                    : `${raffleTotalNumbers} numeros totales`}
                </p>
                <p className={styles.rafflePulseTag}>Draw: {formatDate(highlightedRaffle.drawAt)}</p>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className={styles.sectionBlockAlt}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Prueba social</p>
              <h2>Viajes que ya se estan llenando y comunidad que recomienda</h2>
              <p>Transparencia, actividad real y resultados que refuerzan confianza antes de reservar.</p>
            </div>
          </Reveal>

          <div className={styles.socialProofGrid}>
            <div className={styles.fillingList}>
              <h3>Viajes que se estan llenando</h3>
              {fillingTrips.length > 0 ? (
                fillingTrips.map((trip) => {
                  const sold = Math.max(trip.totalSpots - trip.availableSpots, 0);
                  const startingPrice = getStartingPrice(trip.packages, trip.priceFrom);
                  return (
                    <article key={trip.id} className={styles.fillingItem}>
                      <div>
                        <p className={styles.fillingName}>{trip.title}</p>
                        <p className={styles.fillingHint}>
                          {sold} confirmados · {trip.availableSpots} espacios restantes
                          {startingPrice ? ` · Desde ${formatMoney(startingPrice)}` : ""}
                        </p>
                      </div>
                      <Link href={`/viajes/${trip.slug}`}>Ver viaje</Link>
                    </article>
                  );
                })
              ) : (
                <p className={styles.fillingHint}>Pronto veras salidas en tendencia.</p>
              )}

              <h3 className={styles.sectionTitleInline}>Proximas salidas confirmadas</h3>
              {upcomingTrips.length > 0 ? (
                upcomingTrips.map((trip) => {
                  const startingPrice = getStartingPrice(trip.packages, trip.priceFrom);
                  return (
                    <article key={`${trip.id}-upcoming`} className={styles.fillingItem}>
                      <div>
                        <p className={styles.fillingName}>{trip.title}</p>
                        <p className={styles.fillingHint}>
                          {formatDate(trip.startDate)} · {trip.availableSpots} espacios disponibles
                          {startingPrice ? ` · Desde ${formatMoney(startingPrice)}` : ""}
                        </p>
                      </div>
                      <Link href={`/viajes/${trip.slug}`}>Reservar</Link>
                    </article>
                  );
                })
              ) : (
                <p className={styles.fillingHint}>Estamos cargando nuevas fechas para el proximo release.</p>
              )}
            </div>

            <div className={styles.testimonialGrid}>
              {featuredTestimonials.length > 0 ? (
                featuredTestimonials.map((testimonial, index) => (
                  <Reveal key={testimonial.id} delay={index * 0.04}>
                    <article className={styles.testimonialCard}>
                      <div className={styles.testimonialHead}>
                        <div className={styles.testimonialAvatar}>
                          {testimonial.customerName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3>{testimonial.customerName}</h3>
                          <p>{testimonial.city || testimonial.tripTitle}</p>
                        </div>
                      </div>
                      <p className={styles.testimonialQuote}>“{testimonial.quote}”</p>
                      <p className={styles.testimonialStars}>
                        {"★".repeat(Math.max(1, Math.min(5, testimonial.rating)))}
                        {"☆".repeat(Math.max(0, 5 - testimonial.rating))}
                      </p>
                    </article>
                  </Reveal>
                ))
              ) : (
                <article className={styles.testimonialCard}>
                  <p className={styles.testimonialQuote}>
                    “Nuestra meta es que cada experiencia se convierta en la recomendacion mas facil de hacer.”
                  </p>
                  <p className={styles.testimonialStars}>★★★★★</p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">{benefitsSection?.badge || "Por que viajar con nosotros"}</p>
              <h2>
                {benefitsSection?.title ||
                  "Una operacion premium enfocada en reducir friccion y elevar tu experiencia"}
              </h2>
              <p>
                {benefitsSection?.subtitle ||
                  "Centralizamos todo lo importante para que reserves con confianza y ejecutes tu viaje con soporte real."}
              </p>
            </div>
          </Reveal>

          <div className={styles.benefitsGrid}>
            {benefitCards.slice(0, 4).map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <article className={styles.benefitCard}>
                  <div className={styles.benefitIcon} data-icon={item.icon}>
                    <TravelIcon name={item.icon} className={styles.benefitIconGlyph} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Como funciona</p>
              <h2>{howItWorksSection?.title || "Reserva en 3 pasos y viaja con claridad"}</h2>
              <p>
                {howItWorksSection?.subtitle ||
                  "Sin friccion y con acompanamiento humano desde la solicitud hasta el regreso."}
              </p>
            </div>
          </Reveal>

          <div className={styles.howGrid}>
            {howCards.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <article className={styles.howCard}>
                  <div className={styles.howHead}>
                    <p className={styles.howIndex}>0{index + 1}</p>
                    <span className={styles.howIconWrap}>
                      <TravelIcon name={item.icon} className={styles.howIcon} />
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlockAlt}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Galeria</p>
              <h2>Momentos reales que inspiran a tomar accion</h2>
              <p>Contenido social-proof para transformar intencion en reserva o solicitud de viaje.</p>
            </div>
          </Reveal>

          <div className={styles.galleryGrid}>
            {galleryItems.length > 0 ? (
              galleryItems.map((item, index) => (
                <Reveal key={`${item.url}-${index}`} delay={index * 0.03}>
                  <figure className={styles.galleryItem}>
                    <img src={item.url} alt={item.caption} />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                </Reveal>
              ))
            ) : (
              <figure className={styles.galleryItem}>
                <img
                  src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80"
                  alt="Galeria de viajes"
                />
                <figcaption>Proximamente mas momentos de viaje en nuestra galeria.</figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <Reveal className={styles.utilityBand}>
            {utilityCards.map((card) => (
              <article key={card.title}>
                <div className={styles.utilityTitleRow}>
                  <span className={styles.utilityIconWrap}>
                    <TravelIcon name={card.icon} className={styles.utilityIcon} />
                  </span>
                  <h3>{card.title}</h3>
                </div>
                <p>{card.description}</p>
                <Link href={card.href}>{card.cta}</Link>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className={styles.finalCtaSection}>
        <div className="container">
          <Reveal className={styles.finalCtaCard}>
            <p className="chip">Tu proximo paso</p>
            <h2>{finalCtaSection?.title || "Tu proximo viaje premium empieza hoy."}</h2>
            <p>
              {finalCtaSection?.subtitle ||
                "Habla con nuestro equipo y te ayudamos a elegir destino, plan de pago y experiencia ideal en minutos."}
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.ctaPrimary} href={finalPrimaryHref}>
                {finalPrimaryLabel}
              </Link>
              <Link className={styles.ctaSecondary} href={finalSecondaryHref}>
                {finalSecondaryLabel}
              </Link>
              <a className={styles.ctaGhost} href="https://wa.me/17872349614" target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
