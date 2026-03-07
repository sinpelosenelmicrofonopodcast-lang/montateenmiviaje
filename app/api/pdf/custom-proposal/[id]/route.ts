import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { createDocumentRecordService, getCustomRequestBundleService } from "@/lib/runtime-service";

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
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current.length > 0) {
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

function drawFittedHeading(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  maxWidth: number,
  options?: { maxSize?: number; minSize?: number; maxLines?: number; color?: ReturnType<typeof rgb> }
) {
  const maxSize = options?.maxSize ?? 25;
  const minSize = options?.minSize ?? 16;
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

  const lineHeight = size + 4;
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

  return { nextY: cursorY };
}

function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = rgb(0.2, 0.2, 0.2)
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bundle = await getCustomRequestBundleService(id);

  if (!bundle.request || !bundle.proposal) {
    return NextResponse.json({ message: "Propuesta no encontrada" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

  const logoPath = path.join(process.cwd(), "public", "logo-header.png");
  const logoBytes = await fs.readFile(logoPath);
  const logoImage = await pdf.embedPng(logoBytes);

  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: 24, width: 547, height: 794, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawImage(logoImage, { x: 36, y: 742, width: 52, height: 52 });

  page.drawText("MONTATE EN MI VIAJE", { x: 100, y: 770, size: 17, font: titleFont });
  page.drawText("Propuesta personalizada", { x: 100, y: 752, size: 10, font: bodyFont, color: rgb(0.35, 0.35, 0.35) });

  const heading = drawFittedHeading(page, normalizeTextForPdf(bundle.proposal.title), 36, 706, titleFont, 500, {
    maxSize: 22,
    minSize: 14,
    maxLines: 4,
    color: rgb(0, 0, 0)
  });
  const subtitleY = heading.nextY - 2;
  const metaEndY =
    drawParagraph(
      page,
      `${normalizeTextForPdf(bundle.request.destination)} · ${bundle.request.startDate} - ${bundle.request.endDate} · ${bundle.request.travelers} pax`,
      36,
      subtitleY,
      bodyFont,
      11,
      523,
      rgb(0.2, 0.2, 0.2)
    ) - 2;

  const summaryY = metaEndY - 22;
  drawParagraph(page, normalizeTextForPdf(bundle.proposal.summary), 36, summaryY, bodyFont, 12, 520, rgb(0.15, 0.15, 0.15));

  const itineraryTitleY = summaryY - 44;
  page.drawText("Itinerario", { x: 36, y: itineraryTitleY, size: 15, font: titleFont });
  let y = itineraryTitleY - 20;
  for (const line of bundle.proposal.itinerary.slice(0, 6)) {
    y = drawParagraph(page, `- ${normalizeTextForPdf(line)}`, 36, y, bodyFont, 10, 255) - 4;
  }

  page.drawLine({
    start: { x: 304, y: 220 },
    end: { x: 304, y: Math.min(itineraryTitleY, 610) },
    thickness: 0.8,
    color: rgb(0.87, 0.87, 0.87)
  });

  page.drawText("Incluye", { x: 320, y: itineraryTitleY, size: 14, font: titleFont });
  let rightY = itineraryTitleY - 18;
  for (const line of bundle.proposal.includes.slice(0, 6)) {
    rightY = drawParagraph(page, `- ${normalizeTextForPdf(line)}`, 320, rightY, bodyFont, 10, 230) - 2;
  }

  page.drawText("No incluye", { x: 320, y: rightY - 10, size: 14, font: titleFont });
  rightY -= 28;
  for (const line of bundle.proposal.excludes.slice(0, 6)) {
    rightY = drawParagraph(page, `- ${normalizeTextForPdf(line)}`, 320, rightY, bodyFont, 10, 230) - 2;
  }

  page.drawText("Precio y plan", { x: 320, y: rightY - 8, size: 14, font: titleFont });
  rightY -= 28;
  page.drawText(`Desde USD ${bundle.proposal.pricePerPerson} por persona`, {
    x: 320,
    y: rightY,
    size: 11,
    font: bodyFont
  });
  rightY -= 18;
  page.drawText(`Depósito: USD ${bundle.proposal.deposit}`, { x: 320, y: rightY, size: 11, font: bodyFont });
  rightY -= 18;
  drawParagraph(page, normalizeTextForPdf(bundle.proposal.paymentPlan), 320, rightY, bodyFont, 10, 230, rgb(0.25, 0.25, 0.25));

  page.drawRectangle({ x: 36, y: 58, width: 523, height: 124, color: rgb(0.97, 0.97, 0.97) });
  page.drawText("Notas", { x: 48, y: 160, size: 12, font: titleFont });
  drawParagraph(page, normalizeTextForPdf(bundle.proposal.notes), 48, 142, bodyFont, 10, 500);

  const proposalLink = `${new URL(request.url).origin}/propuesta/${id}`;
  drawParagraph(page, `Link cliente: ${proposalLink}`, 48, 82, bodyFont, 9, 500, rgb(0.35, 0.35, 0.35));

  const bytes = await pdf.save();

  await createDocumentRecordService({
    entityType: "proposal",
    entityId: id,
    title: `${bundle.proposal.title} PDF`,
    language: "es",
    audience: "client",
    includePrices: true,
    downloadUrl: request.url
  });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="custom-proposal-${id}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
