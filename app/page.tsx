import Link from "next/link";
import type { Metadata } from "next";
import { listTripsService } from "@/lib/catalog-service";
import { hgmGoogleReady, listGoogleTrips } from "@/lib/hgm-google";
import { formatMoney, getStartingPrice } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";
import styles from "./travel-home.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Móntate en Mi Viaje | Viajes grupales y experiencias a tu medida",
  description: "Únete a nuestros viajes grupales, conoce nuevos destinos y solicita una experiencia privada para tu familia, amigos o comunidad.",
  alternates: { canonical: "https://www.montateenmiviaje.com" }
};

const guides = [
  { title: "Tu primer viaje en grupo: todo lo que debes saber", category: "GUÍA DE VIAJE", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85", href: "/blog/primer-viaje-en-grupo" },
  { title: "Cómo organizar un viaje con amigos sin complicarte", category: "VIAJES PRIVADOS", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85", href: "/blog/organizar-viaje-con-amigos" },
  { title: "Qué preguntar antes de reservar un viaje grupal", category: "CONSEJOS", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=85", href: "/blog/antes-de-reservar" }
];

export default async function HomePage() {
  const useGoogle = process.env.HGM_GOOGLE_CATALOG_ENABLED === "true" && hgmGoogleReady();
  const trips = await (useGoogle ? listGoogleTrips({ publishedOnly: true }) : listTripsService({ publishedOnly: true })).catch((error) => {
    console.error("Home: unavailable trip catalog", error);
    return [];
  });
  const featured = trips.filter((trip) => trip.featured || trip.availableSpots > 0 || !trip.startDate).slice(0, 3);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroImage} aria-hidden="true" />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> VIAJES EN GRUPO · EXPERIENCIAS REALES</div>
          <h1>El mundo se disfruta <em>mejor juntos.</em></h1>
          <p>Nosotros organizamos el viaje, tú vives la experiencia. Descubre nuevos destinos, comparte momentos inolvidables y viaja con una comunidad que disfruta explorar.</p>
          <div className={styles.heroButtons}>
            <Link href="/viajes" className={styles.primaryButton}>Explorar próximos viajes <span aria-hidden="true">↗</span></Link>
            <Link href="/organizar-viaje" className={styles.lightButton}>Organiza tu propio grupo</Link>
          </div>
          <div className={styles.heroFoot}><span>✦ Itinerarios pensados para compartir</span><span>✦ Atención personalizada</span><span>✦ Grupos y viajes privados</span></div>
        </div>
        <div className={styles.heroNumber}>01 / DESCUBRE</div>
      </section>

      <section className={styles.quickActions} aria-label="Qué deseas hacer">
        <Link href="/viajes" className={styles.quickItem}><span className={styles.quickIcon}>↗</span><span><strong>Quiero unirme a un viaje</strong><small>Mira los grupos y destinos disponibles</small></span><b aria-hidden="true">→</b></Link>
        <Link href="/organizar-viaje" className={styles.quickItem}><span className={styles.quickIcon}>◎</span><span><strong>Quiero organizar mi grupo</strong><small>Amigos, familia, celebraciones o comunidad</small></span><b aria-hidden="true">→</b></Link>
        <Link href="/cotizacion" className={styles.quickItem}><span className={styles.quickIcon}>✧</span><span><strong>Necesito una cotización</strong><small>Cuéntanos tu idea y presupuesto</small></span><b aria-hidden="true">→</b></Link>
      </section>

      <section className={styles.section} id="viajes">
        <div className={styles.sectionTop}><div><span className={styles.kicker}>PRÓXIMAS EXPERIENCIAS</span><h2>Tu próximo gran recuerdo <em>comienza aquí.</em></h2></div><Link href="/viajes" className={styles.textLink}>Ver todos los viajes ↗</Link></div>
        {featured.length ? (
          <div className={styles.tripGrid}>{featured.map((trip) => {
            const price = getStartingPrice(trip.packages, trip.priceFrom);
            return <Link href={`/viajes/${trip.slug}`} className={styles.tripCard} key={trip.id}>
              <div className={styles.tripPhoto}><img src={toPublicImageSrc(trip.heroImage)} alt={trip.destination} loading="lazy" /><span className={styles.tripLabel}>{trip.category}</span></div>
              <div className={styles.tripBody}><span className={styles.tripDestination}>{trip.destination}</span><h3>{trip.title}</h3><p>{trip.summary}</p><div className={styles.tripMeta}><span>{trip.totalSpots > 0 ? `${trip.availableSpots} espacios disponibles` : "Detalles por anunciar"}</span><strong>{price ? `Desde ${formatMoney(price)}` : "Precio por anunciar"}</strong></div><span className={styles.cardLink}>Conoce esta experiencia →</span></div>
            </Link>;
          })}</div>
        ) : (
          <div className={styles.emptyTrips}><div><span className={styles.kicker}>NUEVAS AVENTURAS EN CAMINO</span><h3>Estamos preparando las próximas salidas.</h3><p>Los viajes disponibles se publicarán aquí tan pronto estén confirmados. Mientras tanto, podemos preparar una propuesta para tu grupo.</p><Link href="/organizar-viaje" className={styles.primaryButton}>Solicitar mi viaje ↗</Link></div><img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1100&q=85" alt="Carretera entre montañas" loading="lazy" /></div>
        )}
      </section>

      <section className={styles.storyBlock}>
        <div className={styles.storyPhotos}><img className={styles.storyMain} src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=85" alt="Amigos compartiendo una experiencia" loading="lazy" /><div className={styles.storyCaption}>MÁS QUE DESTINOS. CONEXIONES QUE DURAN.</div></div>
        <div className={styles.storyText}><span className={styles.kicker}>ASÍ VIAJAMOS</span><h2>No es solo ir a un lugar. <em>Es vivirlo juntos.</em></h2><p>En Móntate en Mi Viaje creemos que los mejores recuerdos se crean cuando compartimos el camino. Diseñamos viajes grupales y experiencias personalizadas para quienes quieren descubrir el mundo sin encargarse de cada detalle.</p><p>Organizamos destinos, experiencias e itinerarios para que tú puedas concentrarte en disfrutar, conectar y crear historias que valga la pena contar.</p><Link href="/about" className={styles.darkButton}>Conoce nuestra historia ↗</Link></div>
      </section>

      <section className={styles.section}>
        <div className={styles.centerHeading}><span className={styles.kicker}>TÚ ELIGES CÓMO VIAJAR</span><h2>Una experiencia para <em>cada tipo de grupo.</em></h2><p>Un viaje ya organizado o una aventura diseñada alrededor de tu gente. Tú decides.</p></div>
        <div className={styles.experienceGrid}>
          <Link href="/viajes" className={styles.experienceCard} style={{backgroundImage:"linear-gradient(180deg,rgba(10,27,36,.08),rgba(10,27,36,.85)),url('https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85')"}}><span>01 / VIAJES ABIERTOS</span><div><h3>Únete a una aventura</h3><p>Viaja con nuestro grupo, conoce personas y disfruta un itinerario ya organizado.</p><strong>Explorar destinos ↗</strong></div></Link>
          <Link href="/organizar-viaje" className={styles.experienceCard} style={{backgroundImage:"linear-gradient(180deg,rgba(10,27,36,.08),rgba(10,27,36,.85)),url('https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=1200&q=85')"}}><span>02 / GRUPOS PRIVADOS</span><div><h3>Tu gente, tu viaje</h3><p>Familias, cumpleaños, amigos, retiros y celebraciones con una propuesta personalizada.</p><strong>Crear mi viaje ↗</strong></div></Link>
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionTop}><div><span className={styles.kicker}>SIMPLE Y A TU RITMO</span><h2>Nos encargamos del plan. <em>Tú del equipaje.</em></h2></div></div>
        <div className={styles.steps}>
          {[["01","Cuéntanos tu idea","Elige un viaje publicado o comparte destino, fechas y cantidad de viajeros."],["02","Diseñamos la experiencia","Revisamos las opciones y preparamos una propuesta adaptada a tu grupo."],["03","Confirma los detalles","Conoce lo que incluye, las condiciones y los pasos para reservar."],["04","¡A disfrutar el viaje!","Comparte la aventura con tu grupo y guarda recuerdos inolvidables."]].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </section>

      <section className={styles.quoteBanner}>
        <div><span className={styles.kicker}>VIAJES HECHOS A TU MEDIDA</span><h2>¿Tienes un destino en mente?<br /><em>Nosotros ponemos el plan.</em></h2><p>Cuéntanos cuántas personas viajan, cuándo quieren salir y el presupuesto aproximado. Empecemos a diseñar tu próxima experiencia.</p><Link href="/cotizacion" className={styles.lightSolidButton}>Solicitar cotización ↗</Link></div>
        <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1000&q=85" alt="Paisaje de viaje frente al mar" loading="lazy" />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}><div><span className={styles.kicker}>INSPÍRATE ANTES DE PARTIR</span><h2>Historias, ideas y <em>consejos para viajeros.</em></h2></div><Link href="/blog" className={styles.textLink}>Visitar el blog ↗</Link></div>
        <div className={styles.blogGrid}>{guides.map((guide)=><Link href={guide.href} className={styles.blogCard} key={guide.href}><img src={guide.image} alt="" loading="lazy" /><span>{guide.category}</span><h3>{guide.title}</h3><b>Leer artículo →</b></Link>)}</div>
      </section>

      <section className={styles.facebookSection}><div><span className={styles.kicker}>SIGUE NUESTRA COMUNIDAD</span><h2>La aventura también se comparte <em>fuera del viaje.</em></h2><p>Conoce nuestras novedades, anuncios y publicaciones directamente en nuestra página de Facebook.</p><a href="https://www.facebook.com/profile.php?id=61578995492557" target="_blank" rel="noopener noreferrer" className={styles.darkButton}>Visita nuestro Facebook ↗</a></div><div className={styles.facebookVisual}><span>CONÉCTATE CON NOSOTROS</span><strong>Móntate en Mi Viaje</strong><p>La comunidad de viajeros sigue creciendo.</p></div></section>

      <section className={styles.finalCta}><span className={styles.kicker}>EL PRÓXIMO CAPÍTULO TE ESPERA</span><h2>Los mejores recuerdos no esperan. <em>¿Te montas?</em></h2><div><Link href="/viajes" className={styles.primaryButton}>Ver próximos viajes ↗</Link><Link href="/organizar-viaje" className={styles.outlineButton}>Planificar un grupo</Link></div></section>
    </main>
  );
}
