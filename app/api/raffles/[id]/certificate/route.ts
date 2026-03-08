import { NextResponse } from "next/server";
import { getRaffleByIdService, exportRaffleCertificateService } from "@/lib/raffles-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raffle = await getRaffleByIdService(id);
    if (!raffle || raffle.status === "draft") {
      return NextResponse.json({ message: "Sorteo no encontrado" }, { status: 404 });
    }
    const certificate = await exportRaffleCertificateService(id);
    const body = JSON.stringify(certificate, null, 2);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"raffle-certificate-${id}.json\"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
