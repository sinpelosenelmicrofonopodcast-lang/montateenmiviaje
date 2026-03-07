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
    case "venmo":
      return "V";
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
    case "venmo":
      return "payment-icon venmo";
    case "stripe":
      return "payment-icon stripe";
    default:
      return "payment-icon";
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
              <span>{method.label}</span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
