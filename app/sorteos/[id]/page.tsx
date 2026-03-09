import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RaffleConversionFlow } from "@/components/custom/raffle-conversion-flow";
import { RaffleTransparencyAccordion } from "@/components/custom/raffle-transparency-accordion";
import { getSiteSettingService } from "@/lib/cms-service";
import { formatMoney } from "@/lib/format";
import { toPublicImageSrc } from "@/lib/image-url";
import { parsePaymentLinksSetting } from "@/lib/payment-links";
import {
  getRaffleByIdService,
  getRafflePublicSummaryService,
  listAvailableRaffleNumbersService
} from "@/lib/raffles-service";
import { getServerAuthContext } from "@/lib/admin-guard";
import { normalizeWhatsAppLink } from "@/lib/social-links";
import styles from "./raffle-page.module.css";

interface SorteoDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function asFaqItems(value: unknown) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => (item && typeof item === "object" ? item as { question?: unknown; answer?: unknown } : null))
    .filter((item): item is { question?: unknown; answer?: unknown } => Boolean(item))
    .map((item) => ({
      question: typeof item.question === "string" ? item.question.trim() : "",
      answer: typeof item.answer === "string" ? item.answer.trim() : ""
    }))
    .filter((item) => item.question && item.answer);
}

export default async function SorteoDetailPage({ params }: SorteoDetailPageProps) {
  const { id } = await params;
  const [raffle, summary, availableNumbers, paymentSetting, contactSetting, auth] = await Promise.all([
    getRaffleByIdService(id),
    getRafflePublicSummaryService(id),
    listAvailableRaffleNumbersService(id),
    getSiteSettingService("payment_links"),
    getSiteSettingService("contact_info"),
    getServerAuthContext()
  ]);

  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const paymentConfig = parsePaymentLinksSetting(paymentSetting);
  const whatsappHref = normalizeWhatsAppLink((contactSetting?.value ?? {}).whatsapp) || "https://wa.me/17872349614";
  const canParticipate = raffle.status === "published" && !raffle.drawnAt;

  const rafflePaymentMethods = (raffle.paymentMethods ?? []).filter((method) => method.enabled);
  const paymentLinks = rafflePaymentMethods
    .filter((method) => method.href)
    .map((method) => ({
      key: method.provider,
      label: method.label,
      href: method.href!,
      active: true
    }));

  const activePaymentMethodsWithLink =
    paymentLinks.length > 0
      ? paymentLinks
      : raffle.paymentLinks && raffle.paymentLinks.length > 0
        ? raffle.paymentLinks
        : paymentConfig.methods;

  const heroImage = toPublicImageSrc(raffle.imageUrl, "/logo.png");
  const heroTitle = raffle.title
    ? `SORTEO ${raffle.title.toUpperCase()}`
    : "SORTEO VIAJE A LAS VEGAS 2026";
  const heroBullets = [
    "Viaje para 2 personas",
    "Hotel 3 noches",
    "$500 para gastos"
  ];
  const soldNumbers = summary.metrics.soldNumbers;
  const totalNumbers = summary.metrics.totalNumbers;
  const availableCount = summary.metrics.availableNumbers;
  const progressPercent = summary.metrics.progressPercent;
  const faqItems = raffle.faqItems && raffle.faqItems.length > 0
    ? raffle.faqItems.slice(0, 6)
    : asFaqItems((raffle.drawPayloadJson ?? {}).faq_items).slice(0, 6);

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
              <h1 className={styles.heroTitle}>{heroTitle}</h1>
              <ul className={styles.heroBullets}>
                {heroBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.heroActions}>
                <a className="button-dark" href="#numeros">Elegir mi número</a>
              </div>
            </div>

            <aside className={styles.heroAside}>
              <p className={styles.heroAsideLabel}>Precio por número</p>
              <p className={styles.heroPrice}>{raffle.isFree ? "Gratis" : formatMoney(raffle.entryFee)}</p>
              <p className={styles.heroMeta}>Vendidos {soldNumbers} de {totalNumbers}</p>
              <div className={styles.progressTrack} aria-label={`Progreso ${progressPercent}%`}>
                <span style={{ width: `${Math.max(progressPercent, 2)}%` }} />
              </div>
              <p className={styles.urgency}>
                {availableCount > 0 ? `Disponibles: ${availableCount}` : "Números agotados"}
              </p>
            </aside>
          </div>
        </section>

        {summary.publicNumbersVisibility && canParticipate ? (
          <RaffleConversionFlow
            raffleId={raffle.id}
            isFree={raffle.isFree}
            paymentInstructions={raffle.paymentInstructions}
            paymentMethods={rafflePaymentMethods}
            paymentLinks={activePaymentMethodsWithLink}
            paymentNote={raffle.paymentLinksNote ?? paymentConfig.note}
            initialAvailableNumbers={availableNumbers}
            numberStates={summary.numbers.map((item) => ({ number: item.number, status: item.status }))}
            prefilledEmail={auth.email ?? undefined}
            isAuthenticated={Boolean(auth.user)}
          />
        ) : (
          <section className="card">
            <h3>Participación cerrada</h3>
            <p className="muted">Este sorteo no está aceptando participaciones en este momento.</p>
          </section>
        )}

        <RaffleTransparencyAccordion raffleId={raffle.id} faqItems={faqItems} />
      </div>

      {canParticipate ? (
        <div className={styles.stickyCta}>
          <a className="button-dark" href="#numeros">Elegir mi número</a>
          <a className="button-outline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
          {!auth.user ? <Link className="button-outline" href="/portal/login">Login</Link> : null}
        </div>
      ) : null}
    </main>
  );
}
