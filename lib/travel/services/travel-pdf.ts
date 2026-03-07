import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { TravelPackage, TravelQuote } from "@/lib/travel/types";

function drawTextBlock(page: PDFPage, font: PDFFont, lines: string[], x: number, y: number, size = 11, lineHeight = 15) {
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color: rgb(0.1, 0.1, 0.1) });
    cursor -= lineHeight;
  }
  return cursor;
}

function formatMoney(value: number, currency = "USD") {
  return `${currency} ${Number(value).toFixed(2)}`;
}

async function embedLogo(pdf: PDFDocument) {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-header.png");
    const bytes = await fs.readFile(logoPath);
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

export async function buildTravelQuotePdfBuffer(input: {
  quote: TravelQuote;
  siteName: string;
  generatedBy?: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await embedLogo(pdf);

  page.drawRectangle({
    x: 24,
    y: 24,
    width: 547,
    height: 794,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  if (logo) {
    page.drawImage(logo, { x: 36, y: 742, width: 52, height: 52 });
  }

  page.drawText(input.siteName.toUpperCase(), { x: 96, y: 772, size: 28, font: titleFont, color: rgb(0, 0, 0) });
  page.drawText("Travel Desk · Cotización", { x: 96, y: 742, size: 16, font: bodyFont, color: rgb(0.3, 0.3, 0.3) });

  let y = 694;
  y = drawTextBlock(page, bodyFont, [
    `Quote: ${input.quote.quoteNumber}`,
    `Cliente: ${input.quote.clientName ?? "N/A"} (${input.quote.clientEmail ?? "N/A"})`,
    `Destino: ${input.quote.destination}`,
    `Fechas: ${input.quote.departureDate ?? "Por definir"} - ${input.quote.returnDate ?? "Por definir"}`,
    `Estado: ${input.quote.status}`,
    `Vigencia: ${input.quote.expiresAt ?? "Sin fecha límite"}`
  ], 36, y, 11);

  y -= 8;
  page.drawText("Items incluidos", { x: 36, y, size: 17, font: titleFont, color: rgb(0, 0, 0) });
  y -= 24;
  for (const item of input.quote.items.slice(0, 12)) {
    y = drawTextBlock(page, bodyFont, [
      `${item.itemType.toUpperCase()} · ${item.title}`,
      `Proveedor: ${item.providerName ?? "N/A"} · Total: ${formatMoney(item.totalPrice, input.quote.currency)}`
    ], 40, y, 10, 13);
    y -= 6;
    if (y <= 160) break;
  }

  y -= 6;
  page.drawText("Resumen financiero", { x: 36, y, size: 17, font: titleFont, color: rgb(0, 0, 0) });
  y -= 24;
  y = drawTextBlock(page, bodyFont, [
    `Subtotal: ${formatMoney(input.quote.subtotal, input.quote.currency)}`,
    `Impuestos: ${formatMoney(input.quote.taxesTotal, input.quote.currency)}`,
    `Markup: ${formatMoney(input.quote.markupTotal, input.quote.currency)}`,
    `Fees: ${formatMoney(input.quote.feesTotal, input.quote.currency)}`,
    `Descuentos: ${formatMoney(input.quote.discountTotal, input.quote.currency)}`,
    `TOTAL: ${formatMoney(input.quote.grandTotal, input.quote.currency)}`
  ], 36, y, 12);

  y -= 12;
  if (input.quote.notesClient) {
    y = drawTextBlock(page, bodyFont, [
      "Notas para cliente:",
      input.quote.notesClient.slice(0, 300)
    ], 36, y, 10, 12);
    y -= 8;
  }

  const footerY = 68;
  drawTextBlock(page, bodyFont, [
    "Disclaimer: Tarifas y disponibilidad sujetas a cambio sin previo aviso.",
    `Generado: ${new Date().toLocaleString("es-ES")} · Agente: ${input.generatedBy ?? "Travel Desk"}`
  ], 36, footerY, 9, 11);

  return Buffer.from(await pdf.save());
}

export async function buildTravelPackagePdfBuffer(input: {
  packageData: TravelPackage;
  siteName: string;
  generatedBy?: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await embedLogo(pdf);

  page.drawRectangle({
    x: 24,
    y: 24,
    width: 547,
    height: 794,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  if (logo) {
    page.drawImage(logo, { x: 36, y: 742, width: 52, height: 52 });
  }

  page.drawText(input.siteName.toUpperCase(), { x: 96, y: 772, size: 28, font: titleFont, color: rgb(0, 0, 0) });
  page.drawText("Travel Desk · Paquete", { x: 96, y: 742, size: 16, font: bodyFont, color: rgb(0.3, 0.3, 0.3) });

  let y = 694;
  y = drawTextBlock(page, bodyFont, [
    `Paquete: ${input.packageData.packageName}`,
    `Destino: ${input.packageData.destination}`,
    `Fechas: ${input.packageData.startDate ?? "Por definir"} - ${input.packageData.endDate ?? "Por definir"}`,
    `Estatus: ${input.packageData.status} · Visibilidad: ${input.packageData.visibility}`,
    `Tags: ${(input.packageData.tags ?? []).join(", ") || "N/A"}`
  ], 36, y, 11);

  y -= 8;
  page.drawText("Componentes del paquete", { x: 36, y, size: 17, font: titleFont, color: rgb(0, 0, 0) });
  y -= 24;

  let total = 0;
  for (const item of input.packageData.items.slice(0, 14)) {
    total += item.totalPrice;
    y = drawTextBlock(page, bodyFont, [
      `${item.itemType.toUpperCase()} · ${item.title}`,
      `Total item: ${formatMoney(item.totalPrice)}`
    ], 40, y, 10, 13);
    y -= 6;
    if (y <= 160) break;
  }

  y -= 6;
  page.drawText(`Total estimado del paquete: ${formatMoney(total)}`, {
    x: 36,
    y,
    size: 14,
    font: titleFont,
    color: rgb(0, 0, 0)
  });
  y -= 24;

  if (input.packageData.notes) {
    y = drawTextBlock(page, bodyFont, ["Notas:", input.packageData.notes.slice(0, 420)], 36, y, 10, 12);
  }

  const footerY = 68;
  drawTextBlock(page, bodyFont, [
    "Disclaimer: Tarifas y disponibilidad sujetas a cambio sin previo aviso.",
    `Generado: ${new Date().toLocaleString("es-ES")} · Agente: ${input.generatedBy ?? "Travel Desk"}`
  ], 36, footerY, 9, 11);

  return Buffer.from(await pdf.save());
}
