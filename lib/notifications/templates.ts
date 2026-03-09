import { NotificationEventType, NotificationTemplateResult } from "@/lib/notifications/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback?: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmailHtml(input: {
  heading: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const heading = escapeHtml(input.heading);
  const preheader = escapeHtml(input.preheader);
  const body = escapeHtml(input.body).replaceAll("\n", "<br />");
  const ctaLabel = input.ctaLabel ? escapeHtml(input.ctaLabel) : "";
  const ctaHref = input.ctaHref ? escapeHtml(input.ctaHref) : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ececec;border-radius:16px;padding:24px;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#667085;">Móntate en mi viaje</p>
      <h1 style="margin:0 0 8px 0;font-size:26px;line-height:1.2;color:#111111;">${heading}</h1>
      <p style="margin:0 0 16px 0;font-size:15px;color:#667085;">${preheader}</p>
      <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#111111;">${body}</p>
      ${
        ctaLabel && ctaHref
          ? `<a href="${ctaHref}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">${ctaLabel}</a>`
          : ""
      }
      <p style="margin:20px 0 0 0;font-size:12px;color:#98a2b3;">Si no reconoces este mensaje, ignóralo.</p>
    </div>
  </div>`;
}

export function truncatePushMessage(message: string, max = 160) {
  if (message.length <= max) return message;
  return `${message.slice(0, Math.max(max - 1, 1)).trimEnd()}…`;
}

export function resolveNotificationTemplate(
  eventType: NotificationEventType,
  variables: Record<string, unknown> = {},
  linkOverride?: string
): NotificationTemplateResult {
  const raffleTitle = asString(variables.raffleTitle, "nueva rifa");
  const tripTitle = asString(variables.tripTitle, "nuevo viaje");
  const chosenNumber = asNumber(variables.chosenNumber);
  const chosenNumbers = asString(variables.chosenNumbers, "");
  const paymentAmount = asNumber(variables.amount);
  const reservationExpiresAt = asString(variables.reservationExpiresAt, "");
  const reservationExpirationText = reservationExpiresAt
    ? `Reserva vigente hasta ${reservationExpiresAt}.`
    : "Completa el pago para mantener tu reserva.";
  const fallbackLink = asString(variables.link, "/");

  let base: Omit<NotificationTemplateResult, "email"> & {
    email: Omit<NotificationTemplateResult["email"], "html" | "text">;
  };

  switch (eventType) {
    case "RAFFLE_PUBLISHED":
      base = {
        title: "Nueva rifa disponible",
        message: `Ya salió ${raffleTitle}. Entra ahora y participa.`,
        link: linkOverride ?? fallbackLink ?? "/sorteos",
        kind: "raffle",
        audience: "marketing",
        email: {
          subject: "Nueva rifa disponible en Móntate en mi viaje",
          preheader: "Participa hoy y asegura tu número.",
          heading: "Nueva rifa disponible",
          body: `Publicamos ${raffleTitle}. Participa ahora y revisa números disponibles.`,
          ctaLabel: "Participar ahora",
          ctaHref: linkOverride ?? fallbackLink ?? "/sorteos"
        }
      };
      break;
    case "TRIP_PUBLISHED":
      base = {
        title: "Nuevo viaje disponible",
        message: `Ya tenemos ${tripTitle}. Revisa fechas, cupos y reserva tu espacio.`,
        link: linkOverride ?? fallbackLink ?? "/viajes",
        kind: "trip",
        audience: "marketing",
        email: {
          subject: "Nuevo viaje disponible",
          preheader: "Explora el nuevo itinerario y reserva con depósito.",
          heading: "Nuevo viaje disponible",
          body: `Acabamos de publicar ${tripTitle}. Entra y revisa el itinerario completo.`,
          ctaLabel: "Ver viaje",
          ctaHref: linkOverride ?? fallbackLink ?? "/viajes"
        }
      };
      break;
    case "RAFFLE_ENTRY_CREATED":
      base = {
        title: "Solicitud recibida",
        message: chosenNumbers
          ? `Recibimos tu solicitud para ${chosenNumbers}. Pago pendiente de verificación.`
          : "Recibimos tu solicitud de participación. Pago pendiente de verificación.",
        link: linkOverride ?? fallbackLink ?? "/portal",
        kind: "raffle",
        audience: "transactional",
        email: {
          subject: "Recibimos tu solicitud de participación",
          preheader: "Tus números quedaron reservados temporalmente.",
          heading: "Solicitud recibida",
          body: chosenNumbers
            ? `Reservamos temporalmente ${chosenNumbers}. ${reservationExpirationText}`
            : `Tu solicitud quedó en revisión. ${reservationExpirationText}`,
          ctaLabel: "Ver estado",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal"
        }
      };
      break;
    case "RAFFLE_ENTRY_REVIEW_REQUIRED":
      base = {
        title: "Pago de rifa pendiente de revisión",
        message: chosenNumbers
          ? `Nueva solicitud para ${chosenNumbers}. Revisa y aprueba/rechaza en admin.`
          : "Nueva solicitud de rifa pendiente de revisión.",
        link: linkOverride ?? fallbackLink ?? "/admin/sorteos",
        kind: "admin",
        audience: "transactional",
        email: {
          subject: "Nueva solicitud de rifa pendiente",
          preheader: "Requiere revisión manual de pago.",
          heading: "Pago pendiente de revisión",
          body: chosenNumbers
            ? `Hay una nueva participación para ${chosenNumbers}. Ingresa al panel para revisar evidencia y resolver.`
            : "Hay una nueva participación pendiente de revisión en sorteos.",
          ctaLabel: "Abrir panel admin",
          ctaHref: linkOverride ?? fallbackLink ?? "/admin/sorteos"
        }
      };
      break;
    case "RAFFLE_ENTRY_CONFIRMED":
    case "RAFFLE_ENTRY_ASSIGNED":
      base = {
        title: "Números asignados oficialmente",
        message: chosenNumber
          ? `Tu número #${chosenNumber} ya fue asignado oficialmente.`
          : chosenNumbers
            ? `Tus números ${chosenNumbers} ya fueron asignados oficialmente.`
            : "Tu participación en el sorteo fue asignada oficialmente.",
        link: linkOverride ?? fallbackLink ?? "/portal",
        kind: "raffle",
        audience: "transactional",
        email: {
          subject: "Pago verificado: números asignados",
          preheader: "Todo listo: tu entrada quedó validada.",
          heading: "Participación validada",
          body: chosenNumber
            ? `Verificamos tu pago y asignamos oficialmente el número #${chosenNumber}.`
            : chosenNumbers
              ? `Verificamos tu pago y asignamos oficialmente ${chosenNumbers}.`
              : "Verificamos tu pago y la participación quedó asignada.",
          ctaLabel: "Ver mi participación",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal"
        }
      };
      break;
    case "RAFFLE_ENTRY_REJECTED":
      base = {
        title: "Pago no validado",
        message: chosenNumbers
          ? `No pudimos validar el pago para ${chosenNumbers}. Los números fueron liberados.`
          : "No pudimos validar tu pago. La reserva de números fue liberada.",
        link: linkOverride ?? fallbackLink ?? "/sorteos",
        kind: "raffle",
        audience: "transactional",
        email: {
          subject: "Pago no validado",
          preheader: "Tu reserva fue liberada y puedes volver a participar.",
          heading: "No pudimos validar tu pago",
          body: chosenNumbers
            ? `No fue posible validar el pago para ${chosenNumbers}. Puedes volver a participar seleccionando números disponibles.`
            : "No fue posible validar tu pago. Puedes volver a participar seleccionando números disponibles.",
          ctaLabel: "Participar nuevamente",
          ctaHref: linkOverride ?? fallbackLink ?? "/sorteos"
        }
      };
      break;
    case "RAFFLE_ENTRY_EXPIRING":
      base = {
        title: "Reserva por expirar",
        message: chosenNumbers
          ? `Tu reserva ${chosenNumbers} está por expirar. Completa el pago para conservarla.`
          : "Tu reserva está por expirar. Completa el pago para conservarla.",
        link: linkOverride ?? fallbackLink ?? "/sorteos",
        kind: "raffle",
        audience: "transactional",
        email: {
          subject: "Tu reserva de números está por expirar",
          preheader: "Completa tu pago para conservar tus números.",
          heading: "Reserva por expirar",
          body: chosenNumbers
            ? `Tu reserva para ${chosenNumbers} está por expirar. ${reservationExpirationText}`
            : `Tu reserva está por expirar. ${reservationExpirationText}`,
          ctaLabel: "Completar participación",
          ctaHref: linkOverride ?? fallbackLink ?? "/sorteos"
        }
      };
      break;
    case "RAFFLE_ENTRY_EXPIRED":
      base = {
        title: "Reserva expirada",
        message: chosenNumbers
          ? `La reserva ${chosenNumbers} expiró y los números ya están disponibles nuevamente.`
          : "Tu reserva expiró y los números fueron liberados.",
        link: linkOverride ?? fallbackLink ?? "/sorteos",
        kind: "raffle",
        audience: "transactional",
        email: {
          subject: "Tu reserva expiró",
          preheader: "Puedes volver a participar con números disponibles.",
          heading: "Reserva expirada",
          body: chosenNumbers
            ? `La reserva para ${chosenNumbers} expiró por tiempo. Puedes volver a participar cuando quieras.`
            : "Tu reserva expiró por tiempo. Puedes volver a participar cuando quieras.",
          ctaLabel: "Ver sorteo",
          ctaHref: linkOverride ?? fallbackLink ?? "/sorteos"
        }
      };
      break;
    case "TRIP_BOOKING_UPDATED":
      base = {
        title: "Actualización de tu viaje",
        message: asString(variables.summary, "Hubo cambios importantes en tu viaje. Revisa los detalles en tu cuenta."),
        link: linkOverride ?? fallbackLink ?? "/portal/mis-viajes",
        kind: "booking",
        audience: "transactional",
        email: {
          subject: "Actualización de viaje / reserva",
          preheader: "Revisa cambios importantes en tu itinerario.",
          heading: "Actualización de tu viaje",
          body: asString(variables.summary, "Hubo cambios importantes en tu viaje. Revisa los detalles en tu cuenta."),
          ctaLabel: "Ver detalles",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal/mis-viajes"
        }
      };
      break;
    case "PAYMENT_CONFIRMED":
      base = {
        title: "Pago confirmado",
        message: paymentAmount
          ? `Confirmamos tu pago de USD ${paymentAmount.toFixed(2)}.`
          : "Tu pago fue confirmado correctamente.",
        link: linkOverride ?? fallbackLink ?? "/portal/pagos",
        kind: "payment",
        audience: "transactional",
        email: {
          subject: "Pago confirmado",
          preheader: "Tu pago fue procesado correctamente.",
          heading: "Pago confirmado",
          body: paymentAmount
            ? `Confirmamos tu pago de USD ${paymentAmount.toFixed(2)}.`
            : "Confirmamos tu pago. Puedes ver el estado actualizado en tu portal.",
          ctaLabel: "Ver pagos",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal/pagos"
        }
      };
      break;
    case "PAYMENT_FAILED":
      base = {
        title: "Problema con tu pago",
        message: "Tuvimos un problema con tu pago. Revisa los detalles y vuelve a intentarlo.",
        link: linkOverride ?? fallbackLink ?? "/portal/pagos",
        kind: "payment",
        audience: "transactional",
        email: {
          subject: "Problema con tu pago",
          preheader: "Necesitamos que revises tu pago para completar el proceso.",
          heading: "Problema con tu pago",
          body: "Detectamos un problema con tu pago. Ingresa al portal para revisar el estatus y próximos pasos.",
          ctaLabel: "Revisar pago",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal/pagos"
        }
      };
      break;
    case "MANUAL_ADMIN_BROADCAST":
    case "MANUAL_ADMIN_TARGETED":
      base = {
        title: asString(variables.title, "Actualización importante"),
        message: asString(variables.message, "Tenemos una actualización para ti."),
        link: linkOverride ?? fallbackLink ?? "/portal",
        kind: "admin",
        audience: asString(variables.audience, "marketing") === "transactional" ? "transactional" : "marketing",
        email: {
          subject: asString(variables.emailSubject, asString(variables.title, "Actualización importante")),
          preheader: asString(variables.preheader, "Mensaje oficial de Móntate en mi viaje."),
          heading: asString(variables.title, "Actualización importante"),
          body: asString(variables.message, "Tenemos una actualización para ti."),
          ctaLabel: asString(variables.ctaLabel, "Abrir portal"),
          ctaHref: linkOverride ?? fallbackLink ?? "/portal"
        }
      };
      break;
    default:
      base = {
        title: "Notificación",
        message: "Tienes una nueva notificación en tu cuenta.",
        link: linkOverride ?? fallbackLink ?? "/portal",
        kind: "system",
        audience: "transactional",
        email: {
          subject: "Nueva notificación",
          preheader: "Tienes una actualización en tu cuenta.",
          heading: "Nueva notificación",
          body: "Revisa tu panel para ver los detalles.",
          ctaLabel: "Abrir portal",
          ctaHref: linkOverride ?? fallbackLink ?? "/portal"
        }
      };
  }

  const text = `${base.email.heading}\n\n${base.email.body}${base.email.ctaHref ? `\n\n${base.email.ctaHref}` : ""}`;

  return {
    title: base.title,
    message: base.message,
    link: base.link,
    kind: base.kind,
    audience: base.audience,
    email: {
      ...base.email,
      text,
      html: renderEmailHtml({
        heading: base.email.heading,
        preheader: base.email.preheader,
        body: base.email.body,
        ctaLabel: base.email.ctaLabel,
        ctaHref: base.email.ctaHref
      })
    }
  };
}
