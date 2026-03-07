import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSiteSettingService } from "@/lib/cms-service";
import { hasSupabaseConfig, getSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { buildTravelPackagePdfBuffer, buildTravelQuotePdfBuffer } from "@/lib/travel/services/travel-pdf";
import {
  createTravelPdfExportRecordService,
  getTravelPackageByIdService,
  getTravelQuoteByIdService
} from "@/lib/travel/services/travel-service";

const PDF_BUCKET = process.env.TRAVEL_PDF_BUCKET || "private-documents";
const schema = z.object({
  kind: z.enum(["quote", "package", "summary"]).default("quote"),
  quoteId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  summaryTitle: z.string().optional(),
  summaryNotes: z.string().optional()
});

async function ensurePrivateBucket() {
  if (!hasSupabaseConfig()) {
    return;
  }
  const supabase = getSupabaseAdminClient();
  const list = await supabase.storage.listBuckets();
  if (list.error) {
    throw new Error(`No se pudo validar bucket de PDF: ${list.error.message}`);
  }

  const exists = (list.data ?? []).some((bucket) => bucket.name === PDF_BUCKET);
  if (exists) {
    return;
  }

  const created = await supabase.storage.createBucket(PDF_BUCKET, {
    public: false,
    fileSizeLimit: "20971520"
  });
  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    throw new Error(`No se pudo crear bucket de PDF: ${created.error.message}`);
  }
}

async function buildSummaryPdf(siteName: string, generatedBy?: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const title = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText(siteName.toUpperCase(), { x: 36, y: 784, size: 26, font: title, color: rgb(0, 0, 0) });
  page.drawText("Travel Desk · Resumen interno", { x: 36, y: 754, size: 14, font: body, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(`Generado: ${new Date().toLocaleString("es-ES")}`, { x: 36, y: 716, size: 11, font: body, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Responsable: ${generatedBy ?? "Travel Desk"}`, { x: 36, y: 700, size: 11, font: body, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Este documento resume actividad de Travel Operations.", { x: 36, y: 672, size: 11, font: body });

  return Buffer.from(await pdf.save());
}

export async function POST(request: Request) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const payload = schema.parse(await request.json());
    const identity = await getSiteSettingService("site_identity");
    const siteName =
      typeof identity?.value?.siteName === "string" && identity.value.siteName.trim().length > 0
        ? identity.value.siteName.trim()
        : "Móntate en mi viaje";
    const generatedBy = access.auth.email ?? access.auth.user?.email ?? "travel.agent@internal";

    let bytes: Buffer;
    let relatedId = payload.quoteId ?? payload.packageId ?? randomUUID();
    let fileName = `travel-export-${Date.now()}.pdf`;

    if (payload.kind === "quote") {
      if (!payload.quoteId) {
        return NextResponse.json({ message: "quoteId es requerido para export tipo quote" }, { status: 400 });
      }
      const quote = await getTravelQuoteByIdService(payload.quoteId);
      if (!quote) {
        return NextResponse.json({ message: "Cotización no encontrada" }, { status: 404 });
      }
      bytes = await buildTravelQuotePdfBuffer({ quote, siteName, generatedBy });
      relatedId = quote.id;
      fileName = `travel-quote-${quote.quoteNumber}.pdf`;
    } else if (payload.kind === "package") {
      if (!payload.packageId) {
        return NextResponse.json({ message: "packageId es requerido para export tipo package" }, { status: 400 });
      }
      const packageData = await getTravelPackageByIdService(payload.packageId);
      if (!packageData) {
        return NextResponse.json({ message: "Paquete no encontrado" }, { status: 404 });
      }
      bytes = await buildTravelPackagePdfBuffer({ packageData, siteName, generatedBy });
      relatedId = packageData.id;
      fileName = `travel-package-${packageData.packageName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    } else {
      const summaryBuffer = await buildSummaryPdf(siteName, generatedBy);
      bytes = summaryBuffer;
      fileName = `travel-summary-${Date.now()}.pdf`;
    }

    let filePath = `memory/${fileName}`;
    if (hasSupabaseConfig()) {
      await ensurePrivateBucket();
      const supabase = getSupabaseAdminClient();
      filePath = `travel/${payload.kind}/${relatedId}/${Date.now()}-${randomUUID()}.pdf`;
      const upload = await supabase.storage.from(PDF_BUCKET).upload(filePath, bytes, {
        contentType: "application/pdf",
        upsert: false
      });
      if (upload.error) {
        throw new Error(`No se pudo subir PDF a storage: ${upload.error.message}`);
      }
    }

    const exportRecord = await createTravelPdfExportRecordService({
      relatedType: payload.kind,
      relatedId,
      filePath,
      fileName,
      status: "generated",
      actorId: access.auth.user?.id
    });

    return NextResponse.json({
      ok: true,
      export: exportRecord,
      downloadUrl: `/api/admin/travel/exports/${exportRecord.id}/download`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
