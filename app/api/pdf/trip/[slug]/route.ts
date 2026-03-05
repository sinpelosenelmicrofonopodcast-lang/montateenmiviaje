import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { PDFFont, PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { createDocumentRecord } from "@/lib/booking-store";
import { getTripBySlug } from "@/lib/data";

function wrapLinesByWidth(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width > maxWidth && current.length > 0) {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trip = getTripBySlug(slug);

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

  page.drawText(trip.title, {
    x: 36,
    y: 705,
    size: 28,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  page.drawText(`${trip.destination} · ${trip.startDate} - ${trip.endDate}`, {
    x: 36,
    y: 682,
    size: 11,
    font: bodyFont,
    color: rgb(0.2, 0.2, 0.2)
  });

  const leftX = 36;
  const rightX = 320;
  const leftColWidth = 250;
  const rightColWidth = 235;
  let y = 650;

  y = drawParagraph(page, trip.summary, leftX, y, bodyFont, 11, leftColWidth) - 10;

  page.drawText(lang === "es" ? "Itinerario" : "Itinerary", {
    x: leftX,
    y,
    size: 15,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  y -= 20;

  for (const day of trip.itinerary) {
    page.drawText(`${lang === "es" ? "Dia" : "Day"} ${day.dayNumber}: ${day.title}`, {
      x: leftX,
      y,
      size: 11,
      font: titleFont,
      color: rgb(0, 0, 0)
    });
    y -= 14;
    y = drawParagraph(page, day.description, leftX, y, bodyFont, 10, leftColWidth) - 6;

    if (y < 210) {
      break;
    }
  }

  page.drawLine({
    start: { x: 300, y: 188 },
    end: { x: 300, y: 658 },
    thickness: 0.8,
    color: rgb(0.88, 0.88, 0.88)
  });

  const includesTitle = lang === "es" ? "Incluye" : "Includes";
  const excludesTitle = lang === "es" ? "No incluye" : "Excludes";

  page.drawText(includesTitle, { x: rightX, y: 650, size: 13, font: titleFont, color: rgb(0, 0, 0) });
  let rightY = 632;
  for (const item of trip.includes.slice(0, 6)) {
    rightY = drawParagraph(page, `- ${item}`, rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.1, 0.1, 0.1)) - 2;
  }

  page.drawText(excludesTitle, { x: rightX, y: rightY - 8, size: 13, font: titleFont, color: rgb(0, 0, 0) });
  rightY -= 24;
  for (const item of trip.excludes.slice(0, 5)) {
    rightY = drawParagraph(page, `- ${item}`, rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.1, 0.1, 0.1)) - 2;
  }

  page.drawText(lang === "es" ? "Precio y plan" : "Pricing & plan", {
    x: rightX,
    y: rightY - 8,
    size: 13,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  rightY -= 24;

  const basePackage = trip.packages[0];
  if (showPrices) {
    rightY = drawParagraph(
      page,
      `From USD ${basePackage.pricePerPerson}`,
      rightX,
      rightY,
      bodyFont,
      11,
      rightColWidth,
      rgb(0.1, 0.1, 0.1)
    ) - 2;
    rightY = drawParagraph(
      page,
      `Deposit: USD ${basePackage.deposit}`,
      rightX,
      rightY,
      bodyFont,
      11,
      rightColWidth,
      rgb(0.1, 0.1, 0.1)
    ) - 4;
    rightY = drawParagraph(page, basePackage.paymentPlan, rightX, rightY, bodyFont, 10, rightColWidth, rgb(0.25, 0.25, 0.25)) - 8;
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

  if (audience === "internal") {
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
    page.drawText(`- ${item}`, { x: 48, y: policyY, size: 10, font: bodyFont, color: rgb(0.14, 0.14, 0.14) });
    policyY -= 14;
  }

  page.drawText(lang === "es" ? "Reserva" : "Reserve", {
    x: 365,
    y: 158,
    size: 12,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  page.drawText(reserveUrl, {
    x: 365,
    y: 142,
    size: 9,
    font: bodyFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  page.drawText("QR: escanear para reservar", {
    x: 365,
    y: 124,
    size: 9,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.35)
  });

  const bytes = await pdf.save();

  createDocumentRecord({
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
