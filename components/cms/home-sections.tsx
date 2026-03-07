"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GalleryAlbumBundle } from "@/lib/catalog-service";
import { PageSection } from "@/lib/cms-service";
import { formatMoney } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";
import { Offer, Raffle, Testimonial, Trip } from "@/lib/types";
import styles from "./home-sections.module.css";

interface HomeSectionsProps {
  sections: PageSection[];
  trips: Trip[];
  offers: Offer[];
  testimonials: Testimonial[];
  raffles: Raffle[];
  galleryBundles: GalleryAlbumBundle[];
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

function daysUntil(dateString: string) {
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
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
      if (items.length >= 12) return items;
    }

    if (items.length >= 12) break;
  }

  return items;
}

function findSection(sections: PageSection[], sectionType: string) {
  return sections.find((section) => section.sectionType === sectionType);
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
  preview
}: HomeSectionsProps) {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroSection = findSection(sorted, "hero");
  const benefitsSection = findSection(sorted, "benefits");
  const howItWorksSection = findSection(sorted, "how_it_works");
  const finalCtaSection = findSection(sorted, "final_cta");

  const heroContent = asRecord(heroSection?.content);
  const heroBackground = toPublicImageSrc(
    heroSection?.imageUrl ||
      asString(heroContent.backgroundImage) ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
  );
  const heroBadges = asArray(heroContent.badges)
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, 3);

  const heroTitle = heroSection?.title || "El mundo es grande... tu próxima aventura empieza aquí.";
  const heroSubtitle =
    heroSection?.subtitle ||
    "Vuelos, hoteles y experiencias inolvidables en un solo lugar.";
  const heroPrimaryLabel = heroSection?.ctaLabel || "Explorar viajes";
  const heroPrimaryHref = heroSection?.ctaHref || "/viajes";
  const heroSecondaryLabel = asString(heroContent.secondaryCtaLabel) || "Ver sorteos";
  const heroSecondaryHref = asString(heroContent.secondaryCtaHref) || "/sorteos";

  const activeRaffles = raffles.filter((raffle) => raffle.status === "published");
  const highlightedRaffle = activeRaffles[0] ?? raffles[0] ?? null;

  const trustItems = [
    { label: "Viajes", value: `${trips.length}+`, hint: "Rutas curadas" },
    { label: "Paquetes", value: `${offers.length}+`, hint: "Ofertas activas" },
    { label: "Sorteos", value: `${activeRaffles.length}`, hint: "Campañas en vivo" },
    { label: "Experiencias", value: `${testimonials.length}+`, hint: "Historias reales" }
  ];

  const destinationTrips = trips.slice(0, 4);
  const featuredOffers = offers.slice(0, 4);
  const featuredTestimonials = testimonials.slice(0, Math.max(3, Math.min(6, asNumber(asRecord(findSection(sorted, "testimonials")?.content).limit, 4))));
  const galleryItems = buildGalleryMosaic(galleryBundles).slice(0, 8);

  const benefitItems = asArray(asRecord(benefitsSection?.content).items)
    .map((item) => asRecord(item))
    .filter((item) => asString(item.title));

  const finalCtaContent = asRecord(finalCtaSection?.content);
  const finalPrimaryLabel = finalCtaSection?.ctaLabel || "Comenzar ahora";
  const finalPrimaryHref = finalCtaSection?.ctaHref || "/solicitar-viaje";
  const finalSecondaryLabel = asString(finalCtaContent.secondaryCtaLabel) || "Explorar destinos";
  const finalSecondaryHref = asString(finalCtaContent.secondaryCtaHref) || "/viajes";

  const raffleCountdownDays = highlightedRaffle ? daysUntil(highlightedRaffle.drawAt) : null;

  return (
    <div className={styles.homeRoot}>
      {preview ? <p className={`${styles.previewChip} chip`}>Preview CMS Home</p> : null}

      <section className={styles.heroWrap}>
        <div className="container">
          <Reveal className={styles.heroStage}>
            <div
              className={styles.heroBackdrop}
              style={{ backgroundImage: `linear-gradient(120deg, rgba(8, 14, 28, 0.64), rgba(22, 42, 58, 0.45), rgba(209, 129, 84, 0.33)), url('${heroBackground}')` }}
            />
            <img src="/logo.png" alt="Móntate en mi viaje" className={styles.heroGlobe} />

            <div className={styles.heroContent}>
              <p className={`${styles.heroBadge} chip`}>{heroSection?.badge || "Luxury Group Travel"}</p>
              <div className={styles.badgeRow}>
                {(heroBadges.length ? heroBadges : ["Ofertas exclusivas", "Destinos soñados", "Sorteos activos"]).map((badge) => (
                  <span key={badge} className={styles.badgePill}>{badge}</span>
                ))}
              </div>

              <h1 className={styles.heroTitle}>{heroTitle}</h1>
              <p className={styles.heroSubtitle}>{heroSubtitle}</p>

              <div className={styles.heroActions}>
                <Link className={styles.ctaPrimary} href={heroPrimaryHref}>
                  {heroPrimaryLabel}
                </Link>
                <Link className={styles.ctaSecondary} href={heroSecondaryHref}>
                  {heroSecondaryLabel}
                </Link>
              </div>

              <div className={styles.searchCard}>
                <p className={styles.searchTitle}>Tu próximo viaje premium empieza aquí</p>
                <div className={styles.searchActions}>
                  <Link href="/viajes">Ver viajes</Link>
                  <Link href="/ofertas">Ver ofertas</Link>
                  <Link href="/solicitar-viaje">Viaje a medida</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.trustStripSection}>
        <div className="container">
          <Reveal className={styles.trustStrip}>
            {trustItems.map((item) => (
              <article key={item.label} className={styles.trustItem}>
                <p className={styles.trustValue}>{item.value}</p>
                <p className={styles.trustLabel}>{item.label}</p>
                <p className={styles.trustHint}>{item.hint}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Destinos destacados</p>
              <h2>Escenarios que convierten sueños en itinerarios</h2>
              <p>Diseñados para combinar aventura, estética y servicio concierge.</p>
            </div>
          </Reveal>

          <div className={styles.destinationGrid}>
            {destinationTrips.map((trip, index) => (
              <Reveal key={trip.id} delay={index * 0.05}>
                <Link href={`/viajes/${trip.slug}`} className={styles.destinationCard}>
                  <img src={toPublicImageSrc(trip.heroImage)} alt={trip.title} />
                  <div className={styles.destinationOverlay}>
                    <p className={styles.destinationCategory}>{trip.category}</p>
                    <h3>{trip.title}</h3>
                    <p>{trip.shortDescription || trip.summary}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionBlockAlt}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Experiencias & Ofertas</p>
              <h2>Composición editorial para vender viajes con emoción</h2>
              <p>Paquetes únicos, escapadas exclusivas y experiencias que se agotan rápido.</p>
            </div>
          </Reveal>

          <div className={styles.experienceLayout}>
            {featuredOffers.map((offer, index) => (
              <Reveal key={offer.id} delay={index * 0.06} className={index === 0 ? styles.experienceMain : styles.experienceCardWrap}>
                <article className={index === 0 ? styles.experienceMainCard : styles.experienceCard}>
                  {offer.imageUrl ? <img src={toPublicImageSrc(offer.imageUrl)} alt={offer.title} /> : null}
                  <div>
                    <p className="chip">{offer.discountType === "percent" ? `-${offer.value}%` : formatMoney(offer.value)}</p>
                    <h3>{offer.title}</h3>
                    <p>{offer.subtitle || offer.description}</p>
                    <Link href={offer.ctaHref || "/ofertas"}>{offer.ctaLabel || "Ver experiencia"}</Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {highlightedRaffle ? (
        <section className={styles.sectionBlock}>
          <div className="container">
            <Reveal className={styles.raffleFeature}>
              <div>
                <p className="chip">Sorteo especial</p>
                <h2>{highlightedRaffle.title}</h2>
                <p>{highlightedRaffle.description}</p>
                <div className={styles.raffleMeta}>
                  <span>{highlightedRaffle.isFree ? "Participación gratuita" : `Entrada ${formatMoney(highlightedRaffle.entryFee)}`}</span>
                  <span>{raffleCountdownDays !== null ? `${raffleCountdownDays} días para el draw` : "Draw programado"}</span>
                </div>
                <div className={styles.heroActions}>
                  <Link className={styles.ctaPrimary} href={`/sorteos/${highlightedRaffle.id}`}>
                    Participar ahora
                  </Link>
                  <Link className={styles.ctaSecondary} href="/sorteos">
                    Ver todos los sorteos
                  </Link>
                </div>
              </div>
              <div className={styles.rafflePulseCard}>
                <p className={styles.rafflePulseValue}>{highlightedRaffle.numberPoolSize}</p>
                <p>Números disponibles en pool</p>
                <p className={styles.rafflePulseTag}>Draw: {new Date(highlightedRaffle.drawAt).toLocaleDateString("es-ES")}</p>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className={styles.sectionBlockAlt}>
        <div className="container">
          <Reveal>
            <div className={styles.sectionHeader}>
              <p className="chip">Why choose us</p>
              <h2>{benefitsSection?.title || "Todo tu ecosistema de viajes en un solo lugar"}</h2>
              <p>{benefitsSection?.subtitle || "Diseñamos experiencias premium para vender más y viajar mejor."}</p>
            </div>
          </Reveal>

          <div className={styles.benefitsGrid}>
            {(benefitItems.length
              ? benefitItems.map((item) => ({ title: asString(item.title), description: asString(item.description) }))
              : [
                  { title: "Todo en un solo lugar", description: "Viajes, ofertas, sorteos y acompañamiento en una sola plataforma." },
                  { title: "Viajes diseñados para ti", description: "Itinerarios curados con enfoque estético, comodidad y experiencia local." },
                  { title: "Ofertas atractivas", description: "Acceso a promociones y paquetes dinámicos actualizados por el equipo." },
                  { title: "Experiencias memorables", description: "Comunidad viajera, testimonios verificados y momentos que se comparten." }
                ]).map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <article className={styles.benefitCard}>
                  <div className={styles.benefitIcon} />
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
              <p className="chip">Testimonios</p>
              <h2>Historias reales de personas que ya viajaron con nosotros</h2>
              <p>Confianza social real para convertir visitantes en nuevos viajeros.</p>
            </div>
          </Reveal>

          <div className={styles.testimonialGrid}>
            {featuredTestimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={index * 0.05}>
                <article className={styles.testimonialCard}>
                  <div className={styles.testimonialHead}>
                    <div className={styles.testimonialAvatar}>{testimonial.customerName.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <h3>{testimonial.customerName}</h3>
                      <p>{testimonial.city || testimonial.tripTitle}</p>
                    </div>
                  </div>
                  <p className={styles.testimonialQuote}>“{testimonial.quote}”</p>
                  <p className={styles.testimonialStars}>{"★".repeat(Math.max(1, Math.min(5, testimonial.rating)))}{"☆".repeat(Math.max(0, 5 - testimonial.rating))}</p>
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
              <p className="chip">Galería</p>
              <h2>Momentos que inspiran tu próximo destino</h2>
              <p>Collage visual aspiracional para convertir scroll en intención de compra.</p>
            </div>
          </Reveal>

          <div className={styles.galleryGrid}>
            {galleryItems.map((item, index) => (
              <Reveal key={`${item.url}-${index}`} delay={index * 0.03}>
                <figure className={styles.galleryItem}>
                  <img src={item.url} alt={item.caption} />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCtaSection}>
        <div className="container">
          <Reveal className={styles.finalCtaCard}>
            <p className="chip">Tu próximo paso</p>
            <h2>{finalCtaSection?.title || "Tu próxima historia comienza con un solo paso."}</h2>
            <p>
              {finalCtaSection?.subtitle ||
                "Haz clic, elige tu destino y deja que nuestro equipo convierta tu idea en una experiencia inolvidable."}
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.ctaPrimary} href={finalPrimaryHref}>
                {finalPrimaryLabel}
              </Link>
              <Link className={styles.ctaSecondary} href={finalSecondaryHref}>
                {finalSecondaryLabel}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {howItWorksSection ? (
        <section className={styles.sectionBlockThin}>
          <div className="container">
            <Reveal>
              <div className={styles.sectionHeaderCompact}>
                <p className="chip">Cómo funciona</p>
                <h3>{howItWorksSection.title || "Reserva sin fricción"}</h3>
                <p>{howItWorksSection.subtitle || "Solicita, confirma y prepárate para vivir tu viaje."}</p>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}
    </div>
  );
}
