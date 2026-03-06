import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createDocumentRecordService, getCustomRequestBundleService } from "@/lib/runtime-service";

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

  page.drawText(bundle.proposal.title, { x: 36, y: 706, size: 25, font: titleFont });
  page.drawText(
    `${bundle.request.destination} · ${bundle.request.startDate} - ${bundle.request.endDate} · ${bundle.request.travelers} pax`,
    { x: 36, y: 685, size: 11, font: bodyFont, color: rgb(0.2, 0.2, 0.2) }
  );

  page.drawText(bundle.proposal.summary, { x: 36, y: 654, size: 12, font: bodyFont, color: rgb(0.15, 0.15, 0.15), maxWidth: 520, lineHeight: 16 });

  page.drawText("Itinerario", { x: 36, y: 610, size: 15, font: titleFont });
  let y = 590;
  for (const line of bundle.proposal.itinerary.slice(0, 6)) {
    page.drawText(`- ${line}`, { x: 36, y, size: 10, font: bodyFont, maxWidth: 255, lineHeight: 13 });
    y -= 26;
  }

  page.drawLine({ start: { x: 304, y: 220 }, end: { x: 304, y: 610 }, thickness: 0.8, color: rgb(0.87, 0.87, 0.87) });

  page.drawText("Incluye", { x: 320, y: 610, size: 14, font: titleFont });
  let rightY = 592;
  for (const line of bundle.proposal.includes.slice(0, 6)) {
    page.drawText(`- ${line}`, { x: 320, y: rightY, size: 10, font: bodyFont, maxWidth: 230, lineHeight: 13 });
    rightY -= 18;
  }

  page.drawText("No incluye", { x: 320, y: rightY - 10, size: 14, font: titleFont });
  rightY -= 28;
  for (const line of bundle.proposal.excludes.slice(0, 6)) {
    page.drawText(`- ${line}`, { x: 320, y: rightY, size: 10, font: bodyFont, maxWidth: 230, lineHeight: 13 });
    rightY -= 18;
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
  page.drawText(bundle.proposal.paymentPlan, {
    x: 320,
    y: rightY,
    size: 10,
    font: bodyFont,
    maxWidth: 230,
    lineHeight: 13,
    color: rgb(0.25, 0.25, 0.25)
  });

  page.drawRectangle({ x: 36, y: 58, width: 523, height: 124, color: rgb(0.97, 0.97, 0.97) });
  page.drawText("Notas", { x: 48, y: 160, size: 12, font: titleFont });
  page.drawText(bundle.proposal.notes, { x: 48, y: 142, size: 10, font: bodyFont, maxWidth: 500, lineHeight: 13 });

  const proposalLink = `${new URL(request.url).origin}/propuesta/${id}`;
  page.drawText(`Link cliente: ${proposalLink}`, { x: 48, y: 82, size: 9, font: bodyFont, color: rgb(0.35, 0.35, 0.35) });

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
