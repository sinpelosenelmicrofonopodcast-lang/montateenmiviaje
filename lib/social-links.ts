import type { TravelIconName } from "@/components/ui/travel-icons";

export interface SocialLink {
  key: string;
  label: string;
  href: string;
  icon: TravelIconName;
}

const KNOWN_SOCIALS: Array<{
  key: string;
  label: string;
  icon: TravelIconName;
}> = [
  { key: "instagram", label: "Instagram", icon: "instagram" },
  { key: "facebook", label: "Facebook", icon: "facebook" },
  { key: "tiktok", label: "TikTok", icon: "tiktok" },
  { key: "youtube", label: "YouTube", icon: "youtube" },
  { key: "x", label: "X", icon: "x" },
  { key: "twitter", label: "Twitter", icon: "x" },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin" }
];

const SKIP_KEYS = new Set(["whatsapp"]);

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toTitleCase(value: string) {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function normalizeExternalLink(rawValue: unknown) {
  const value = asTrimmedString(rawValue);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("mailto:") || value.startsWith("tel:")) {
    return value;
  }
  return `https://${value}`;
}

export function normalizeWhatsAppLink(rawValue: unknown) {
  const value = asTrimmedString(rawValue);
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

export function readSocialLinks(value: unknown): SocialLink[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const raw = value as Record<string, unknown>;
  const usedKeys = new Set<string>();

  const known = KNOWN_SOCIALS.map((item) => {
    const href = normalizeExternalLink(raw[item.key]);
    if (!href) return null;
    usedKeys.add(item.key);
    return {
      key: item.key,
      label: item.label,
      href,
      icon: item.icon
    } satisfies SocialLink;
  }).filter((item): item is SocialLink => Boolean(item));

  const dynamic = Object.entries(raw)
    .filter(([key, entry]) => {
      if (SKIP_KEYS.has(key) || usedKeys.has(key)) {
        return false;
      }
      return normalizeExternalLink(entry).length > 0;
    })
    .map(([key, entry]) => ({
      key,
      label: toTitleCase(key.replace(/[_-]/g, " ")),
      href: normalizeExternalLink(entry),
      icon: "web" as const
    }));

  return [...known, ...dynamic];
}
