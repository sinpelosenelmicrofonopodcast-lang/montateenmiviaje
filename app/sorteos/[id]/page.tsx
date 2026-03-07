import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyValueButton } from "@/components/custom/copy-value-button";
import { RaffleCountdown } from "@/components/custom/raffle-countdown";
import { RaffleEntryForm } from "@/components/custom/raffle-entry-form";
import { RaffleNumberGrid } from "@/components/custom/raffle-number-grid";
import { PaymentMethodLinks } from "@/components/payment-method-links";
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
import styles from "./raffle-page.module.css";

interface SorteoDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SorteoDetailPage({ params }: SorteoDetailPageProps) {
  const { id } = await params;
  const [raffle, paymentSetting] = await Promise.all([
    getRaffleByIdService(id),
    getSiteSettingService("payment_links")
  ]);
  const paymentConfig = parsePaymentLinksSetting(paymentSetting);

  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const [summary, participants, verification, availableNumbers] = await Promise.all([
    getRafflePublicSummaryService(id),
    listPublicRaffleParticipantsService(id),
    getRaffleVerificationPayloadService(id),
    listAvailableRaffleNumbersService(id)
  ]);

  const entriesCount = summary.metrics.confirmedEntries + summary.metrics.reservedNumbers;
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
  const howToJoinItems = raffle.howToJoinItems && raffle.howToJoinItems.length > 0
    ? raffle.howToJoinItems
    : [
        "Elige tu número favorito en el grid.",
        raffle.isFree ? "Completa el formulario y confirma tus datos." : "Selecciona método de pago y envía comprobante si aplica.",
        "Recibe validación de tu participación.",
        "Sigue el countdown para el anuncio del ganador."
      ];
  const faqItems = raffle.faqItems && raffle.faqItems.length > 0
    ? raffle.faqItems
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
          question: "¿Cómo verifico el resultado?",
          answer: "En la sección de verificación verás seed, hash y datos del draw."
        }
      ];

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
            <div>
              <div className={styles.heroBadges}>
                {heroBadges.map((badge, index) => (
                  <span key={`${badge}-${index}`} className={styles.heroBadge}>{badge}</span>
                ))}
              </div>
              <h1 className={styles.heroTitle}>{raffle.title}</h1>
              <p className={styles.heroSubtitle}>{raffle.publicSubtitle ?? raffle.description}</p>
            </div>
            <div className={styles.heroBottom}>
              <p className={styles.heroPrice}>
                {raffle.isFree ? "Entrada sin costo" : <>Desde <strong>{formatMoney(raffle.entryFee)}</strong> por número</>}
              </p>
              <div className={styles.heroActions}>
                <a className="button-dark" href="#participar">
                  {raffle.publicCtaLabel ?? raffle.ctaLabel ?? "Participar ahora"}
                </a>
                <a className="button-outline" href="#verificacion">Verificar sorteo</a>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Total números</p>
            <p className={styles.metricValue}>{summary.metrics.totalNumbers}</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Disponibles</p>
            <p className={styles.metricValue}>{summary.metrics.availableNumbers}</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Vendidos</p>
            <p className={styles.metricValue}>{summary.metrics.soldNumbers}</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Progreso</p>
            <p className={styles.metricValue}>{summary.metrics.progressPercent}%</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Participaciones confirmadas</p>
            <p className={styles.metricValue}>{confirmedCount}</p>
          </article>
        </div>

        <RaffleCountdown drawAt={raffle.drawAt} drawnAt={raffle.drawnAt} winnerNumber={raffle.winnerNumber} />

        <div className={styles.twoCols}>
          <section className="card">
            <h3>Premio y detalles</h3>
            <p className="muted">{raffle.description}</p>
            <p><strong>Premio principal:</strong> {raffle.prize}</p>
            <p><strong>Ventana:</strong> {raffle.startDate} - {raffle.endDate}</p>
            <p><strong>Anuncio del ganador:</strong> {new Date(raffle.drawAt).toLocaleString("es-ES")}</p>
            <div className={styles.listBlock}>
              {prizeIncludes.map((item) => (
                <div key={item} className={styles.listItem}>{item}</div>
              ))}
            </div>
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
              <p style={{ marginTop: "12px" }}>
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
          <section className="card">
            <h3>Números de la rifa</h3>
            <p className="muted">
              Modo público: <strong>{summary.publicGridMode}</strong>
            </p>
            {summary.publicGridMode === "totals_only" ? null : (
              <RaffleNumberGrid numbers={summary.numbers} />
            )}
            <p className="muted">
              Vendidos: {summary.metrics.soldNumbers} · Reservados: {summary.metrics.reservedNumbers} · Bloqueados:{" "}
              {summary.metrics.blockedNumbers} · Entradas registradas: {entriesCount}
            </p>
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
            />
          ) : (
            <section className="card">
              <h3>Participación cerrada</h3>
              <p className="muted">Este sorteo ya cerró participaciones.</p>
            </section>
          )}
        </div>

        {participants.length > 0 ? (
          <section className="card">
            <h3>Lista pública de participantes</h3>
            <div className="raffle-public-participants">
              {participants.map((participant) => (
                <p key={participant.entryId}>
                  {participant.displayName}
                  {typeof participant.chosenNumber === "number" ? ` · #${participant.chosenNumber}` : ""}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section id="verificacion" className="card">
          <h3>Verificación del sorteo</h3>
          <p className="muted">Resultado transparente mediante commit-reveal y hash verificable.</p>
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
          <div className={styles.listBlock}>
            {faqItems.map((item, index) => (
              <details key={`${item.question}-${index}`} className={styles.listItem}>
                <summary><strong>{item.question}</strong></summary>
                <p className="muted" style={{ marginTop: "8px" }}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>¿Listo para participar?</h3>
          <p className="muted">Si todavía no tienes cuenta, regístrate y vuelve para asegurar tu número.</p>
          <div className="button-row">
            <a className="button-dark" href="#participar">Participar ahora</a>
            <Link className="button-outline" href="/registro">Crear cuenta</Link>
            <Link className="button-outline" href="/sorteos">Ver otros sorteos</Link>
          </div>
        </section>
      </div>

      {canParticipate ? (
        <div className={styles.stickyCta}>
          <a className="button-dark" href="#participar">Participar</a>
          <a className="button-outline" href="#verificacion">Verificar</a>
        </div>
      ) : null}
    </main>
  );
}
