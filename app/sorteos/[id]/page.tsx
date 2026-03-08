import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyValueButton } from "@/components/custom/copy-value-button";
import { RaffleCountdown } from "@/components/custom/raffle-countdown";
import { RaffleEntryForm } from "@/components/custom/raffle-entry-form";
import { RaffleNumberGrid } from "@/components/custom/raffle-number-grid";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { getServerAuthContext } from "@/lib/admin-guard";
import { getSiteSettingService } from "@/lib/cms-service";
import { formatMoney } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";
import { parsePaymentLinksSetting } from "@/lib/payment-links";
import {
  getRaffleByIdService,
  getRafflePublicSummaryService,
  getRaffleVerificationPayloadService,
  listAvailableRaffleNumbersService,
  listPublicRaffleParticipantsService
} from "@/lib/raffles-service";
import { normalizeWhatsAppLink } from "@/lib/social-links";
import styles from "./raffle-page.module.css";

interface SorteoDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("es-PR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function SorteoDetailPage({ params }: SorteoDetailPageProps) {
  const { id } = await params;
  const [raffle, paymentSetting, contactSetting, auth] = await Promise.all([
    getRaffleByIdService(id),
    getSiteSettingService("payment_links"),
    getSiteSettingService("contact_info"),
    getServerAuthContext()
  ]);
  const paymentConfig = parsePaymentLinksSetting(paymentSetting);
  const whatsappHref = normalizeWhatsAppLink((contactSetting?.value ?? {}).whatsapp) || "https://wa.me/17872349614";

  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const [summary, participants, verification, availableNumbers] = await Promise.all([
    getRafflePublicSummaryService(id),
    listPublicRaffleParticipantsService(id),
    getRaffleVerificationPayloadService(id),
    listAvailableRaffleNumbersService(id)
  ]);

  const confirmedCount = summary.metrics.confirmedEntries;
  const canParticipate = raffle.status === "published" && !raffle.drawnAt;
  const rafflePaymentMethods = (raffle.paymentMethods ?? []).filter((method) => method.enabled);
  const rafflePaymentMethodsWithLink = rafflePaymentMethods
    .filter((method) => method.href)
    .map((method) => ({
      key: method.provider,
      label: method.label,
      href: method.href!,
      active: true
    }));
  const rafflePaymentLinks = raffle.paymentLinks ?? [];
  const activePaymentMethodsWithLink = rafflePaymentMethodsWithLink.length > 0
    ? rafflePaymentMethodsWithLink
    : rafflePaymentLinks.length > 0
      ? rafflePaymentLinks
      : paymentConfig.methods;
  const activePaymentNote = raffle.paymentLinksNote ?? paymentConfig.note;
  const heroImage = toPublicImageSrc(raffle.imageUrl, "/logo.png");
  const heroBadges = raffle.promoBadges && raffle.promoBadges.length > 0
    ? raffle.promoBadges
    : [
        canParticipate ? "Sorteo activo" : "Resultado publicado",
        raffle.isFree ? "Entrada gratis" : `Entrada ${formatMoney(raffle.entryFee)}`,
        `${summary.metrics.availableNumbers} números disponibles`
      ];
  const prizeIncludes = raffle.prizeIncludes && raffle.prizeIncludes.length > 0
    ? raffle.prizeIncludes
    : [raffle.prize, "Sorteo transparente", "Soporte por WhatsApp"];
  const heroBenefits = prizeIncludes.slice(0, 4);
  const howToJoinItems = raffle.howToJoinItems && raffle.howToJoinItems.length > 0
    ? raffle.howToJoinItems
    : [
        "Elige tu número favorito en el grid.",
        raffle.isFree ? "Completa el formulario y confirma tus datos." : "Selecciona método de pago y envía comprobante si aplica.",
        "Recibe validación de tu participación.",
        "Sigue el countdown para el anuncio del ganador."
      ];
  const faqItems = raffle.faqItems && raffle.faqItems.length > 0
    ? raffle.faqItems.slice(0, 5)
    : [
        {
          question: "¿Quién puede participar?",
          answer: "Solo usuarios registrados en la plataforma."
        },
        {
          question: "¿Cómo sé si mi entrada fue validada?",
          answer: "Tu entrada pasa a estado confirmado una vez validada por el equipo."
        },
        {
          question: "¿Cómo se verifica el resultado?",
          answer: "En la sección de verificación verás seed, hash y datos del draw."
        }
      ];
  const soldNumbers = summary.metrics.soldNumbers;
  const totalNumbers = summary.metrics.totalNumbers;
  const availableCount = summary.metrics.availableNumbers;
  const progressPercent = summary.metrics.progressPercent;
  const urgencyLabel =
    availableCount <= 12
      ? `Solo quedan ${availableCount} números disponibles`
      : progressPercent >= 60
        ? `Más del ${progressPercent}% de los números ya están vendidos`
        : "Participa temprano para elegir tu número ideal";

  const heroTitle = raffle.title || "Viaje a Las Vegas para 2 personas";
  const heroTitleClass = heroTitle.length > 54 ? `${styles.heroTitle} ${styles.heroTitleCompact}` : styles.heroTitle;
  const heroSubtitle =
    raffle.publicSubtitle?.trim() ||
    "Memorial Weekend 2026 con vuelos, hotel y experiencia premium incluida.";

  const showParticipants = participants.length > 0;

  return (
    <main className="container section">
      <div className={styles.rafflePage}>
        <section className={styles.hero}>
          <Image
            src={heroImage}
            alt={raffle.title}
            fill
            sizes="100vw"
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.heroMain}>
              <div className={styles.heroBadges}>
                {heroBadges.map((badge, index) => (
                  <span key={`${badge}-${index}`} className={styles.heroBadge}>{badge}</span>
                ))}
              </div>
              <h1 className={heroTitleClass}>{heroTitle}</h1>
              <p className={styles.heroSubtitle}>{heroSubtitle}</p>

              <ul className={styles.heroBenefits}>
                {heroBenefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className={styles.heroActions}>
                <a className="button-dark" href="#participar">
                  {raffle.publicCtaLabel?.trim() || "Elegir mi número"}
                </a>
                <a className="button-outline" href="#numeros">Ver números disponibles</a>
                <a className="button-outline" href="#verificacion">Verificar sorteo</a>
              </div>
            </div>

            <aside className={styles.heroAside}>
              <p className={styles.heroAsideLabel}>Precio por número</p>
              <p className={styles.heroPrice}>
                {raffle.isFree ? "Gratis" : formatMoney(raffle.entryFee)}
              </p>
              <div className={styles.heroMetaGrid}>
                <div>
                  <span>Total</span>
                  <strong>{totalNumbers}</strong>
                </div>
                <div>
                  <span>Disponibles</span>
                  <strong>{availableCount}</strong>
                </div>
                <div>
                  <span>Vendidos</span>
                  <strong>{soldNumbers}</strong>
                </div>
                <div>
                  <span>Confirmados</span>
                  <strong>{confirmedCount}</strong>
                </div>
              </div>
              <p className={styles.heroDate}>Anuncio del ganador: {formatDate(raffle.drawAt)}</p>
            </aside>
          </div>
        </section>

        <section className={`card ${styles.progressCard}`}>
          <div className={styles.progressHead}>
            <div>
              <p className={styles.kicker}>Progreso del sorteo</p>
              <h2>Vendidos {soldNumbers} de {totalNumbers} números</h2>
            </div>
            <p className={styles.progressPercent}>{progressPercent}%</p>
          </div>
          <div className={styles.progressTrack} aria-label={`Progreso ${progressPercent}%`}>
            <span style={{ width: `${Math.max(progressPercent, 3)}%` }} />
          </div>
          <p className={styles.urgency}>{urgencyLabel}</p>
        </section>

        <RaffleCountdown
          drawAt={raffle.drawAt}
          drawnAt={raffle.drawnAt}
          winnerNumber={raffle.winnerNumber}
          availableNumbers={availableCount}
          totalNumbers={totalNumbers}
        />

        <section className={styles.flowGrid}>
          {[
            "1. Ve el premio y elige tu número",
            "2. Completa tus datos",
            "3. Realiza el pago o confirma gratis",
            "4. Recibe validación y sigue el draw"
          ].map((step) => (
            <article key={step} className={styles.flowCard}>
              {step}
            </article>
          ))}
        </section>

        <div className={styles.twoCols}>
          <section className="card">
            <h3>Premio principal</h3>
            <p className="muted">{raffle.description}</p>
            <p><strong>Incluye:</strong></p>
            <div className={styles.listBlock}>
              {prizeIncludes.map((item) => (
                <div key={item} className={styles.listItem}>{item}</div>
              ))}
            </div>
            <p><strong>Ventana del viaje:</strong> {formatDate(raffle.startDate)} - {formatDate(raffle.endDate)}</p>
          </section>

          <section className="card">
            <h3>Cómo participar</h3>
            <div className={styles.listBlock}>
              {howToJoinItems.map((item, index) => (
                <div key={`${item}-${index}`} className={styles.listItem}>
                  <strong>Paso {index + 1}.</strong> {item}
                </div>
              ))}
            </div>
            {raffle.urgencyMessage ? (
              <p className={styles.urgencyMessage}>
                <strong>Urgente:</strong> {raffle.urgencyMessage}
              </p>
            ) : null}
          </section>
        </div>

        {!raffle.isFree && activePaymentMethodsWithLink.length > 0 ? (
          <PaymentMethodLinks
            methods={activePaymentMethodsWithLink}
            note={activePaymentNote}
            title="Métodos de pago disponibles"
          />
        ) : null}

        {summary.publicNumbersVisibility ? (
          <section id="numeros" className="card">
            <h3>Números disponibles estilo lotería</h3>
            <p className="muted">
              Modo público: <strong>{summary.publicGridMode}</strong>
            </p>
            {summary.publicGridMode === "totals_only" ? (
              <p className="muted">El administrador configuró visibilidad por totales únicamente.</p>
            ) : (
              <RaffleNumberGrid numbers={summary.numbers} />
            )}
          </section>
        ) : null}

        <div id="participar">
          {canParticipate ? (
            <RaffleEntryForm
              raffleId={raffle.id}
              isFree={raffle.isFree}
              paymentInstructions={raffle.paymentInstructions}
              paymentMethods={rafflePaymentMethods}
              paymentLinks={activePaymentMethodsWithLink}
              paymentNote={activePaymentNote}
              initialAvailableNumbers={availableNumbers}
              prefilledEmail={auth.email ?? undefined}
              isAuthenticated={Boolean(auth.user)}
            />
          ) : (
            <section className="card">
              <h3>Participación cerrada</h3>
              <p className="muted">Este sorteo ya cerró participaciones.</p>
            </section>
          )}
        </div>

        {showParticipants ? (
          <section className="card">
            <div className={styles.sectionHead}>
              <h3>Participantes confirmados</h3>
              <p className="muted">Prueba social en tiempo real (respeta privacidad configurada).</p>
            </div>
            <div className={styles.participantsGrid}>
              {participants.slice(0, 120).map((participant) => (
                <article key={participant.entryId} className={styles.participantCard}>
                  <p>{participant.displayName}</p>
                  <div className={styles.participantMeta}>
                    {typeof participant.chosenNumber === "number" ? <span>#{participant.chosenNumber}</span> : null}
                    <span>{participant.source === "offline" ? "Offline" : "Online"}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="verificacion" className={`card ${styles.verificationCard}`}>
          <div className={styles.sectionHead}>
            <h3>Verificación segura del sorteo</h3>
            <p className="muted">Sistema transparente basado en commit-reveal y hash verificable.</p>
          </div>
          {verification ? (
            <div className={styles.verificationGrid}>
              <div className={styles.verificationRow}>
                <div>
                  <p className="muted">Algoritmo</p>
                  <p>{verification.algorithm}</p>
                </div>
              </div>
              <div className={styles.verificationRow}>
                <div>
                  <p className="muted">Seed pública</p>
                  <p className={styles.verificationValue}>{verification.publicSeed ?? "Pendiente"}</p>
                </div>
                {verification.publicSeed ? <CopyValueButton value={verification.publicSeed} /> : null}
              </div>
              <div className={styles.verificationRow}>
                <div>
                  <p className="muted">Commit hash</p>
                  <p className={styles.verificationValue}>{verification.commitHash ?? "Pendiente"}</p>
                </div>
                {verification.commitHash ? <CopyValueButton value={verification.commitHash} /> : null}
              </div>
              <div className={styles.verificationRow}>
                <div>
                  <p className="muted">Draw hash</p>
                  <p className={styles.verificationValue}>{verification.drawHash ?? "Pendiente"}</p>
                </div>
                {verification.drawHash ? <CopyValueButton value={verification.drawHash} /> : null}
              </div>
            </div>
          ) : (
            <p className="muted">Pendiente de publicación de datos verificables.</p>
          )}
        </section>

        <section className="card">
          <h3>Preguntas frecuentes</h3>
          <div className={styles.faqList}>
            {faqItems.map((item, index) => (
              <details key={`${item.question}-${index}`} className={styles.faqItem}>
                <summary>{item.question}</summary>
                <p className="muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`card ${styles.finalCta}`}>
          <div>
            <p className={styles.kicker}>Último paso</p>
            <h3>Participa hoy y asegura tu número</h3>
            <p className="muted">
              Premio: <strong>{raffle.prize}</strong> · Entrada:{" "}
              <strong>{raffle.isFree ? "Gratis" : formatMoney(raffle.entryFee)}</strong> · Disponibles:{" "}
              <strong>{availableCount}</strong>
            </p>
          </div>
          <div className="button-row">
            <a className="button-dark" href="#participar">Participar ahora</a>
            <a className="button-outline" href={whatsappHref} target="_blank" rel="noreferrer">
              Resolver dudas por WhatsApp
            </a>
            {!auth.user ? <Link className="button-outline" href="/registro">Crear cuenta</Link> : null}
          </div>
        </section>
      </div>

      {canParticipate ? (
        <div className={styles.stickyCta}>
          <a className="button-dark" href="#participar">Elegir número</a>
          <a className="button-outline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      ) : null}
    </main>
  );
}
