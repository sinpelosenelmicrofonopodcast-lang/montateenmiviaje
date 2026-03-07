import type { SiteSetting } from "@/lib/cms-service";

export interface PaymentMethodLink {
  key: string;
  label: string;
  href: string;
  active: boolean;
}

export interface PaymentLinksConfig {
  methods: PaymentMethodLink[];
  note?: string;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function isAllowedHref(value: string) {
  const href = value.trim().toLowerCase();
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("paypal.me/") ||
    href.startsWith("cash.app/") ||
    href.startsWith("$")
  );
}

function normalizeHref(value: string) {
  const href = value.trim();
  if (!href) return "";

  if (href.startsWith("paypal.me/")) {
    return `https://${href}`;
  }
  if (href.startsWith("cash.app/")) {
    return `https://${href}`;
  }
  if (href.startsWith("$")) {
    return `https://cash.app/${href}`;
  }
  if (href.startsWith("www.")) {
    return `https://${href}`;
  }
  return href;
}

export function parsePaymentLinksSetting(setting: SiteSetting | null): PaymentLinksConfig {
  const fallback: PaymentLinksConfig = { methods: [], note: undefined };
  if (!setting) return fallback;

  const value = asRecord(setting.value);
  const methodsRaw = Array.isArray(value.methods) ? value.methods : [];

  const methods = methodsRaw
    .map((item) => asRecord(item))
    .map((item): PaymentMethodLink | null => {
      const key = asString(item.key).toLowerCase();
      const label = asString(item.label) || key;
      const href = normalizeHref(asString(item.href) || asString(item.url));
      const active = asBoolean(item.active, true);

      if (!key || !label || !href || !active || !isAllowedHref(href)) {
        return null;
      }

      return { key, label, href, active };
    })
    .filter((item): item is PaymentMethodLink => item !== null);

  return {
    methods,
    note: asString(value.note) || undefined
  };
}
