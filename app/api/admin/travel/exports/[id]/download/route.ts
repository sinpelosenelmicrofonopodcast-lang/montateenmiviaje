import { NextResponse } from "next/server";
import { hasSupabaseConfig, getSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireTravelDeskApiAccess } from "@/lib/travel/api-auth";
import { getTravelPdfExportByIdService } from "@/lib/travel/services/travel-service";

const PDF_BUCKET = process.env.TRAVEL_PDF_BUCKET || "private-documents";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireTravelDeskApiAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const { id } = await params;
    const exportRecord = await getTravelPdfExportByIdService(id);
    if (!exportRecord) {
      return NextResponse.json({ message: "Export no encontrado" }, { status: 404 });
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { message: "Storage no configurado para descarga en este entorno", export: exportRecord },
        { status: 501 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const download = await supabase.storage.from(PDF_BUCKET).download(exportRecord.filePath);
    if (download.error || !download.data) {
      return NextResponse.json(
        { message: `No se pudo descargar archivo privado: ${download.error?.message ?? "sin data"}` },
        { status: 500 }
      );
    }

    const bytes = Buffer.from(await download.data.arrayBuffer());
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${exportRecord.fileName}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
