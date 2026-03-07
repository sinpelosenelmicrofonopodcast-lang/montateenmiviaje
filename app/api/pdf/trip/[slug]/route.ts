import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { PDFFont, PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getTripBySlugService } from "@/lib/catalog-service";
import { createDocumentRecordService } from "@/lib/runtime-service";

function normalizeTextForPdf(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function wrapLinesByChars(text: string, maxChars: number) {
  const words = normalizeTextForPdf(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function wrapLinesByWidth(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = normalizeTextForPdf(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const safeWord = (() => {
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        return [word];
      }

      const parts: string[] = [];
      let chunk = "";
      for (const char of word) {
        const candidate = `${chunk}${char}`;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && chunk) {
          parts.push(chunk);
          chunk = char;
        } else {
          chunk = candidate;
        }
      }
      if (chunk) parts.push(chunk);
      return parts;
    })();

    for (const piece of safeWord) {
      const candidate = current.length === 0 ? piece : `${current} ${piece}`;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width > maxWidth && current.length > 0) {
        lines.push(current);
        current = piece;
      } else {
        current = candidate;
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = rgb(0.12, 0.12, 0.12)
) {
  const lines = wrapLinesByWidth(text, font, size, maxWidth);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color
    });
    currentY -= size + 4;
  }

  return currentY;
}

function drawFittedHeading(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  maxWidth: number,
  options?: { maxSize?: number; minSize?: number; maxLines?: number; color?: ReturnType<typeof rgb> }
) {
  const maxSize = options?.maxSize ?? 28;
  const minSize = options?.minSize ?? 18;
  const maxLines = options?.maxLines ?? 3;
  const color = options?.color ?? rgb(0, 0, 0);
  const hardMaxChars = 34;

  let size = maxSize;
  let lines = wrapLinesByWidth(text, font, size, maxWidth);
  if (lines.length <= 1) {
    lines = wrapLinesByChars(text, hardMaxChars);
  }

  while (
    size > minSize &&
    (lines.length > maxLines || lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidth))
  ) {
    size -= 1;
    lines = wrapLinesByWidth(text, font, size, maxWidth);
    if (lines.length <= 1) {
      lines = wrapLinesByChars(text, hardMaxChars);
    }
  }

  while (size > 12 && lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidth)) {
    size -= 1;
  }

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, Math.max(0, last.length - 3))}...` : `${last}...`;
  }

  const lineHeight = size + 5;
  let cursorY = y;
  for (const line of lines.slice(0, maxLines)) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color
    });
    cursorY -= lineHeight;
  }

  return {
    size,
    lines,
    nextY: cursorY
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trip = await getTripBySlugService(slug, { includeUnpublished: true });

  if (!trip) {
    return NextResponse.json({ message: "Viaje no encontrado" }, { status: 404 });
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const audience = url.searchParams.get("audience") === "internal" ? "internal" : "client";
  const showPrices = url.searchParams.get("showPrices") !== "false";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

  const logoPath = path.join(process.cwd(), "public", "logo-header.png");
  const logoBytes = await fs.readFile(logoPath);
  const logoImage = await pdf.embedPng(logoBytes);

  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: 24, width: 547, height: 794, borderColor: rgb(0, 0, 0), borderWidth: 1.2 });
  page.drawImage(logoImage, { x: 36, y: 742, width: 52, height: 52 });

  page.drawText("MONTATE EN MI VIAJE", {
    x: 100,
    y: 770,
    size: 17,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  page.drawText(lang === "es" ? "Brochure Premium" : "Premium Brochure", {
    x: 100,
    y: 752,
    size: 10,
    font: bodyFont,
    color: rgb(0.3, 0.3, 0.3)
  });

  const heading = drawFittedHeading(page, normalizeTextForPdf(trip.title), 36, 705, titleFont, 500, {
    maxSize: 24,
    minSize: 15,
    maxLines: 4,
    color: rgb(0, 0, 0)
  });
  const subtitleY = heading.nextY - 2;

  const metaEndY =
    drawParagraph(
      page,
      `${normalizeTextForPdf(trip.destination)} · ${trip.startDate} - ${trip.endDate}`,
      36,
      subtitleY,
      bodyFont,
      11,
      523,
      rgb(0.2, 0.2, 0.2)
    ) - 2;

  const leftX = 36;
  const rightX = 320;
  const leftColWidth = 250;
  const rightColWidth = 235;
  const contentTopY = metaEndY - 20;
  let y = contentTopY;

  y = drawParagraph(page, normalizeTextForPdf(trip.summary), leftX, y, bodyFont, 11, leftColWidth) - 10;

  page.drawText(lang === "es" ? "Itinerario" : "Itinerary", {
    x: leftX,
    y,
    size: 15,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  y -= 20;

  for (const day of trip.itinerary) {
    page.drawText(`${lang === "es" ? "Dia" : "Day"} ${day.dayNumber}: ${normalizeTextForPdf(day.title)}`, {
      x: leftX,
      y,
      size: 11,
      font: titleFont,
      color: rgb(0, 0, 0)
    });
    y -= 14;
    y = drawParagraph(page, normalizeTextForPdf(day.description), leftX, y, bodyFont, 10, leftColWidth) - 6;

    if (y < 210) {
      break;
    }
  }

  page.drawLine({
    start: { x: 300, y: 188 },
    end: { x: 300, y: Math.min(contentTopY + 8, 658) },
    thickness: 0.8,
    color: rgb(0.88, 0.88, 0.88)
  });

  const includesTitle = lang === "es" ? "Incluye" : "Includes";
  const excludesTitle = lang === "es" ? "No incluye" : "Excludes";

  page.drawText(includesTitle, { x: rightX, y: contentTopY, size: 13, font: titleFont, color: rgb(0, 0, 0) });
  let rightY = contentTopY - 18;
  for (const item of trip.includes.slice(0, 6)) {
    rightY =
      drawParagraph(page, `- ${normalizeTextForPdf(item)}`, rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.1, 0.1, 0.1)) -
      2;
  }

  page.drawText(excludesTitle, { x: rightX, y: rightY - 8, size: 13, font: titleFont, color: rgb(0, 0, 0) });
  rightY -= 24;
  for (const item of trip.excludes.slice(0, 5)) {
    rightY =
      drawParagraph(page, `- ${normalizeTextForPdf(item)}`, rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.1, 0.1, 0.1)) -
      2;
  }

  page.drawText(lang === "es" ? "Precio y plan" : "Pricing & plan", {
    x: rightX,
    y: rightY - 8,
    size: 13,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  rightY -= 24;

  const sortedPackages = [...trip.packages].sort((a, b) => a.pricePerPerson - b.pricePerPerson);
  const basePackage = sortedPackages[0];
  const effectivePriceFrom =
    typeof trip.priceFrom === "number" && Number.isFinite(trip.priceFrom) && trip.priceFrom > 0
      ? trip.priceFrom
      : basePackage?.pricePerPerson;

  if (showPrices && effectivePriceFrom) {
    rightY = drawParagraph(
      page,
      `From USD ${Math.round(effectivePriceFrom)}`,
      rightX,
      rightY,
      bodyFont,
      11,
      rightColWidth,
      rgb(0.1, 0.1, 0.1)
    ) - 2;
    if (basePackage) {
      rightY = drawParagraph(
        page,
        `Deposit: USD ${Math.round(basePackage.deposit)}`,
        rightX,
        rightY,
        bodyFont,
        11,
        rightColWidth,
        rgb(0.1, 0.1, 0.1)
      ) - 4;
      rightY =
        drawParagraph(page, normalizeTextForPdf(basePackage.paymentPlan), rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.25, 0.25, 0.25)) -
        8;
    }
  } else if (!basePackage) {
    rightY = drawParagraph(
      page,
      lang === "es" ? "Paquetes en configuración" : "Packages in setup",
      rightX,
      rightY,
      bodyFont,
      11,
      rightColWidth,
      rgb(0.25, 0.25, 0.25)
    ) - 4;
  } else {
    rightY = drawParagraph(
      page,
      lang === "es" ? "Tarifas bajo solicitud" : "Pricing on request",
      rightX,
      rightY,
      bodyFont,
      11,
      rightColWidth,
      rgb(0.25, 0.25, 0.25)
    ) - 4;
  }

  if (audience === "internal" && basePackage) {
    const estimatedCost = Math.round(basePackage.pricePerPerson * 0.72);
    const margin = basePackage.pricePerPerson - estimatedCost;
    rightY = drawParagraph(
      page,
      `Internal cost: USD ${estimatedCost}`,
      rightX,
      rightY,
      bodyFont,
      10,
      rightColWidth,
      rgb(0.12, 0.12, 0.12)
    ) - 2;
    rightY = drawParagraph(
      page,
      `Margin est.: USD ${margin}`,
      rightX,
      rightY,
      bodyFont,
      10,
      rightColWidth,
      rgb(0.12, 0.12, 0.12)
    ) - 2;
  }

  const reserveUrl = `${url.origin}/reservar/${trip.slug}`;
  const reserveDisplayUrl = reserveUrl.replace(/^https?:\/\//, "");
  let qrImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(reserveUrl, {
      margin: 0,
      width: 256,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    const base64 = qrDataUrl.split(",")[1];
    if (base64) {
      qrImage = await pdf.embedPng(Buffer.from(base64, "base64"));
    }
  } catch {
    qrImage = null;
  }

  page.drawRectangle({ x: 36, y: 58, width: 523, height: 120, color: rgb(0.97, 0.97, 0.97) });
  page.drawText(lang === "es" ? "Politicas" : "Policies", {
    x: 48,
    y: 158,
    size: 12,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  let policyY = 142;
  for (const item of trip.policies.slice(0, 3)) {
    policyY =
      drawParagraph(page, `- ${normalizeTextForPdf(item)}`, 48, policyY, bodyFont, 10, 300, rgb(0.14, 0.14, 0.14)) -
      2;
  }

  page.drawText(lang === "es" ? "Reserva" : "Reserve", {
    x: 365,
    y: 158,
    size: 12,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  const urlEndY = drawParagraph(page, reserveDisplayUrl, 365, 142, bodyFont, 9, 132, rgb(0.1, 0.1, 0.1));
  page.drawText(lang === "es" ? "Escanea el QR o entra con link" : "Scan QR or use the link", {
    x: 365,
    y: Math.max(94, urlEndY - 2),
    size: 9,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.35)
  });
  if (qrImage) {
    page.drawRectangle({
      x: 502,
      y: 82,
      width: 48,
      height: 48,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.86, 0.86, 0.86),
      borderWidth: 0.6
    });
    page.drawImage(qrImage, {
      x: 503.5,
      y: 83.5,
      width: 45,
      height: 45
    });
  }

  const bytes = await pdf.save();

  await createDocumentRecordService({
    entityType: "trip",
    entityId: trip.id,
    title: `${trip.title} PDF`,
    language: lang,
    audience,
    includePrices: showPrices,
    downloadUrl: request.url
  });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${trip.slug}-${audience}-${lang}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
