import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendEmailLogService,
  createCustomProposalService,
  getCustomTripRequestService,
  markCustomRequestReviewingService
} from "@/lib/runtime-service";
import { sendEmailNotification } from "@/lib/email";

const createProposalSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(8),
  itinerary: z.array(z.string().min(4)).min(1),
  includes: z.array(z.string().min(2)).min(1),
  excludes: z.array(z.string().min(2)).min(1),
  pricePerPerson: z.number().positive(),
  deposit: z.number().positive(),
  paymentPlan: z.string().min(4),
  notes: z.string().min(2),
  pdfUrl: z.string().min(1),
  pageUrl: z.string().min(1)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await markCustomRequestReviewingService(id);

    const payload = createProposalSchema.parse(await request.json());
    const proposal = await createCustomProposalService(id, payload);

    const customRequest = await getCustomTripRequestService(id);
    if (!customRequest) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });
    }

    const pageLink = `${new URL(request.url).origin}${payload.pageUrl}`;
    const pdfLink = payload.pdfUrl.startsWith("http")
      ? payload.pdfUrl
      : `${new URL(request.url).origin}${payload.pdfUrl}`;

    const emailLog = await sendEmailNotification({
      to: customRequest.customerEmail,
      subject: `Tu paquete personalizado está listo: ${proposal.title}`,
      text: `Hola ${customRequest.customerName}, tu paquete ya está listo. Revisa aquí: ${pageLink} o descarga el PDF: ${pdfLink}`,
      html: `<p>Hola <strong>${customRequest.customerName}</strong>,</p><p>Tu paquete personalizado ya está listo.</p><p><a href="${pageLink}">Ver propuesta</a></p><p><a href="${pdfLink}">Descargar PDF</a></p>`
    });

    await appendEmailLogService(emailLog);

    return NextResponse.json({
      ok: true,
      proposalId: proposal.id,
      revision: proposal.revision,
      emailProvider: emailLog.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Payload inválido", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("no encontrada") ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
