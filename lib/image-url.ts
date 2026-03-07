const FALLBACK_IMAGE = "/logo-mark.svg";

function parseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function extractGoogleDriveId(url: URL) {
  const fromQuery = url.searchParams.get("id");
  if (fromQuery) {
    return fromQuery;
  }

  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  const ucMatch = url.pathname.match(/\/uc$/i);
  if (ucMatch) {
    const fromUcQuery = url.searchParams.get("id");
    if (fromUcQuery) {
      return fromUcQuery;
    }
  }

  return null;
}

export function normalizeImageUrl(input: string) {
  const value = input.trim();
  const parsed = parseUrl(value);
  if (!parsed) {
    return value;
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "drive.google.com" || host === "docs.google.com") {
    const fileId = extractGoogleDriveId(parsed);
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
    }
  }

  if (host.endsWith("dropbox.com")) {
    parsed.searchParams.set("raw", "1");
    return parsed.toString();
  }

  return parsed.toString();
}

export function toPublicImageSrc(input: string | null | undefined, fallback = FALLBACK_IMAGE) {
  const value = (input ?? "").trim();
  if (!value) {
    return fallback;
  }

  if (value.startsWith("/") || value.startsWith("data:image/")) {
    return value;
  }

  const normalized = normalizeImageUrl(value);
  const parsed = parseUrl(normalized);
  if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
    return fallback;
  }

  return `/api/media/image?url=${encodeURIComponent(parsed.toString())}`;
}
