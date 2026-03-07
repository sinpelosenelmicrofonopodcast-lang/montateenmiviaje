import { NextResponse } from "next/server";
import { normalizeImageUrl } from "@/lib/image-url";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;
const REQUEST_HEADERS = {
  Accept: "image/*,text/html;q=0.8,*/*;q=0.5",
  "User-Agent": "MontateImageProxy/1.0 (+https://montateenmiviaje.com)"
};

function parseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) {
    return true;
  }

  if (host === "::1" || host === "[::1]") {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      return true;
    }

    const [a, b] = parts;
    if (
      a === 10 ||
      a === 127 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254)
    ) {
      return true;
    }
  }

  return false;
}

function assertSafeUrl(raw: string) {
  const parsed = parseUrl(raw);
  if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
    throw new Error("URL inválida");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Host no permitido");
  }

  return parsed;
}

async function fetchWithTimeout(url: string, accept: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        ...REQUEST_HEADERS,
        Accept: accept
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function readMetaImageFromHtml(html: string, baseUrl: string) {
  const tags = html.match(/<meta[\s\S]*?>/gi) ?? [];
  const candidates: string[] = [];

  for (const tag of tags) {
    const attr = (name: string) => {
      const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
      return match?.[1]?.trim() ?? "";
    };

    const property = attr("property").toLowerCase();
    const name = attr("name").toLowerCase();
    const content = attr("content");
    if (!content) {
      continue;
    }

    if (
      property === "og:image" ||
      property === "og:image:url" ||
      property === "og:image:secure_url" ||
      name === "og:image" ||
      name === "twitter:image" ||
      name === "twitter:image:src"
    ) {
      candidates.push(content);
    }
  }

  for (const candidate of candidates) {
    try {
      const resolved = new URL(candidate, baseUrl);
      return resolved.toString();
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveImageUrl(raw: string) {
  const normalized = normalizeImageUrl(raw);
  const safeUrl = assertSafeUrl(normalized).toString();
  const response = await fetchWithTimeout(safeUrl, "image/*,text/html;q=0.8,*/*;q=0.5");

  if (!response.ok) {
    throw new Error(`Origen respondió ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.startsWith("image/") || contentType.startsWith("application/octet-stream")) {
    return response.url || safeUrl;
  }

  if (!contentType.includes("text/html")) {
    throw new Error("El enlace no apunta a una imagen");
  }

  const htmlBuffer = await response.arrayBuffer();
  if (htmlBuffer.byteLength > MAX_HTML_BYTES) {
    throw new Error("Documento HTML demasiado grande");
  }

  const html = new TextDecoder().decode(htmlBuffer);
  const extractedImage = readMetaImageFromHtml(html, response.url || safeUrl);
  if (!extractedImage) {
    throw new Error("No se encontró imagen pública en ese enlace");
  }

  return assertSafeUrl(normalizeImageUrl(extractedImage)).toString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ message: "Falta parámetro url" }, { status: 400 });
  }

  try {
    const resolvedImage = await resolveImageUrl(rawUrl);
    const response = await fetchWithTimeout(resolvedImage, "image/*,*/*;q=0.8");

    if (!response.ok) {
      throw new Error(`No se pudo descargar imagen (${response.status})`);
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.startsWith("image/") && !contentType.startsWith("application/octet-stream")) {
      throw new Error("La URL final no devolvió imagen");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error("Imagen supera límite de 15MB");
    }

    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Imagen supera límite de 15MB");
    }

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType.startsWith("image/") ? contentType : "image/jpeg",
        "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=86400"
      }
    });
  } catch {
    const normalized = normalizeImageUrl(rawUrl);
    const safe = parseUrl(normalized);
    if (safe && /^https?:$/i.test(safe.protocol) && !isPrivateHost(safe.hostname)) {
      return NextResponse.redirect(safe.toString(), 307);
    }

    return NextResponse.json({ message: "No se pudo procesar la imagen" }, { status: 422 });
  }
}
