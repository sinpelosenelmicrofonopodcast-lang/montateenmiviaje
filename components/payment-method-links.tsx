"use client";

import type { PaymentMethodLink } from "@/lib/payment-links";

interface PaymentMethodLinksProps {
  methods: PaymentMethodLink[];
  note?: string;
  title?: string;
}

function iconTextForKey(key: string) {
  switch (key) {
    case "paypal":
      return "PP";
    case "cashapp":
      return "$";
    case "zelle":
      return "Z";
    case "ath_movil":
      return "ATH";
    case "venmo":
      return "V";
    case "apple_pay":
      return "AP";
    case "google_pay":
      return "GP";
    case "bank_transfer":
      return "BT";
    case "athmovil":
      return "ATH";
    case "zellepay":
      return "Z";
    case "stripe":
      return "S";
    default:
      return key.slice(0, 2).toUpperCase();
  }
}

function classForKey(key: string) {
  switch (key) {
    case "paypal":
      return "payment-icon paypal";
    case "cashapp":
      return "payment-icon cashapp";
    case "zelle":
      return "payment-icon zelle";
    case "ath_movil":
      return "payment-icon athmovil";
    case "venmo":
      return "payment-icon venmo";
    case "apple_pay":
      return "payment-icon applepay";
    case "google_pay":
      return "payment-icon googlepay";
    case "bank_transfer":
      return "payment-icon banktransfer";
    case "athmovil":
      return "payment-icon athmovil";
    case "zellepay":
      return "payment-icon zelle";
    case "stripe":
      return "payment-icon stripe";
    default:
      return "payment-icon";
  }
}

function helperTextForKey(key: string) {
  switch (key) {
    case "paypal":
      return "Pago inmediato";
    case "cashapp":
    case "zelle":
    case "ath_movil":
    case "athmovil":
    case "venmo":
      return "Transferencia manual";
    case "stripe":
    case "apple_pay":
    case "google_pay":
      return "Checkout digital";
    default:
      return "Abrir método";
  }
}

function externalTargetForHref(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return { target: "_blank", rel: "noreferrer" as const };
  }
  return {};
}

export function PaymentMethodLinks({ methods, note, title = "Métodos de pago" }: PaymentMethodLinksProps) {
  if (methods.length === 0 && !note) {
    return null;
  }

  return (
    <section className="card">
      <h3>{title}</h3>
      {note ? <p className="muted">{note}</p> : null}
      {methods.length > 0 ? (
        <div className="payment-links-grid">
          {methods.map((method) => (
            <a key={`${method.key}-${method.href}`} href={method.href} className="payment-link-card" {...externalTargetForHref(method.href)}>
              <span className={classForKey(method.key)}>{iconTextForKey(method.key)}</span>
              <span style={{ display: "grid", gap: "2px" }}>
                <strong>{method.label}</strong>
                <small className="muted">{helperTextForKey(method.key)}</small>
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
