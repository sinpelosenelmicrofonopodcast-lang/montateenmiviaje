"use client";

import { useEffect, useMemo, useState } from "react";
import { toPublicImageSrc } from "@/lib/image-url";
import { Raffle, RaffleEntry, RaffleNumber, RafflePayment, RafflePaymentMethodConfig } from "@/lib/types";

type AdminTab = "overview" | "numbers" | "entries" | "payments" | "referrals" | "live" | "settings" | "audit";

interface AdminRafflePanelProps {
  initialRaffles: Raffle[];
  initialEntries: RaffleEntry[];
}

interface SnapshotResponse {
  snapshot: {
    raffle: Raffle;
    metrics: {
      totalNumbers: number;
      available: number;
      blocked: number;
      reserved: number;
      pendingManualReview: number;
      sold: number;
      cancelled: number;
      winners: number;
      confirmedEntries: number;
      pendingEntries: number;
      rejectedEntries: number;
      offlineEntries: number;
      conversionsFromReferral: number;
    };
    numbers: RaffleNumber[];
    entries: RaffleEntry[];
    payments: RafflePayment[];
    logs: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId?: string;
      metadataJson: Record<string, unknown>;
      createdAt: string;
    }>;
    referrals: Array<{
      referralCode: string;
      clicks: number;
      conversions: number;
    }>;
  };
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function yesNo(value: boolean | undefined) {
  return value ? "Sí" : "No";
}

type PaymentMethodDraft = RafflePaymentMethodConfig;

interface RaffleSettingsDraft {
  publicParticipantsEnabled: boolean;
  publicParticipantsMode: "hidden" | "name_only" | "name_number" | "masked";
  publicNumbersVisibility: boolean;
  publicNumberGridMode: "full" | "available_only" | "sold_only" | "totals_only";
  publicWinnerName: boolean;
  verificationMode: "none" | "commit_reveal";
  referralEnabled: boolean;
  viralCounterEnabled: boolean;
  publicActivityEnabled: boolean;
  liveDrawEnabled: boolean;
  urgencyMessage: string;
  publicSubtitle: string;
  publicCtaLabel: string;
  promoBadgesText: string;
  prizeIncludesText: string;
  howToJoinText: string;
  faqText: string;
  paymentMethods: PaymentMethodDraft[];
  paymentLinksNote: string;
}

const PRESET_PAYMENT_METHODS: Array<{ key: string; label: string }> = [
  { key: "stripe", label: "Tarjeta / Stripe" },
  { key: "paypal", label: "PayPal" },
  { key: "ath_movil", label: "ATH Movil" },
  { key: "zelle", label: "Zelle" },
  { key: "cashapp", label: "Cash App" },
  { key: "venmo", label: "Venmo" },
  { key: "bank_transfer", label: "Transferencia bancaria" }
];

function createDefaultPaymentMethods(): PaymentMethodDraft[] {
  return PRESET_PAYMENT_METHODS.map((method, index) => ({
    provider: method.key,
    enabled: false,
    label: method.label,
    instructions: "",
    destinationValue: "",
    href: "",
    displayOrder: index,
    requiresReference: true,
    requiresScreenshot: false,
    isAutomatic: method.key === "stripe",
    config: {}
  }));
}

function buildPaymentMethodsForSettings(raffle: Raffle | null): PaymentMethodDraft[] {
  const baseMap = new Map<string, PaymentMethodDraft>();

  for (const method of createDefaultPaymentMethods()) {
    baseMap.set(method.provider, method);
  }

  const existing = raffle?.paymentMethods ?? [];
  for (const method of existing) {
    const provider = method.provider.trim().toLowerCase();
    if (!provider) continue;
    baseMap.set(provider, {
      provider,
      enabled: method.enabled ?? true,
      label: method.label || provider,
      instructions: method.instructions ?? "",
      destinationValue: method.destinationValue ?? "",
      href: method.href ?? "",
      displayOrder: Number.isFinite(method.displayOrder) ? method.displayOrder : 0,
      requiresReference: Boolean(method.requiresReference),
      requiresScreenshot: Boolean(method.requiresScreenshot),
      isAutomatic: Boolean(method.isAutomatic),
      config: method.config ?? {}
    });
  }

  return Array.from(baseMap.values()).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function createDefaultSettingsDraft(): RaffleSettingsDraft {
  return {
    publicParticipantsEnabled: false,
    publicParticipantsMode: "masked",
    publicNumbersVisibility: true,
    publicNumberGridMode: "full",
    publicWinnerName: false,
    verificationMode: "commit_reveal",
    referralEnabled: true,
    viralCounterEnabled: true,
    publicActivityEnabled: true,
    liveDrawEnabled: true,
    urgencyMessage: "",
    publicSubtitle: "",
    publicCtaLabel: "",
    promoBadgesText: "",
    prizeIncludesText: "",
    howToJoinText: "",
    faqText: "",
    paymentMethods: createDefaultPaymentMethods(),
    paymentLinksNote: ""
  };
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFaqText(value: string) {
  return toLines(value)
    .map((line) => line.split("|").map((item) => item.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map(([question, answer]) => ({ question, answer }));
}

function faqItemsToText(items: Array<{ question: string; answer: string }> | undefined) {
  return (items ?? []).map((item) => `${item.question} | ${item.answer}`).join("\n");
}

export function AdminRafflePanel({ initialRaffles, initialEntries }: AdminRafflePanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [raffles, setRaffles] = useState(initialRaffles);
  const [entries, setEntries] = useState(initialEntries);
  const [selectedRaffleId, setSelectedRaffleId] = useState(initialRaffles[0]?.id ?? "");
  const [snapshot, setSnapshot] = useState<SnapshotResponse["snapshot"] | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [editingRaffleId, setEditingRaffleId] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [numberStatusFilter, setNumberStatusFilter] = useState<string>("all");
  const [numberSearch, setNumberSearch] = useState("");
  const [bulkAction, setBulkAction] = useState<"block" | "unblock" | "reserve" | "mark_sold" | "cancel">("block");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [offlineSale, setOfflineSale] = useState({
    fullName: "",
    email: "",
    phone: "",
    quantity: "1",
    numbers: "",
    randomAssignment: true,
    paymentMethod: "zelle",
    amount: "",
    paymentReference: "",
    note: "",
    markAsConfirmed: true
  });
  const [settings, setSettings] = useState<RaffleSettingsDraft>(() => createDefaultSettingsDraft());
  const [form, setForm] = useState({
    title: "",
    description: "",
    rulesText: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    isFree: true,
    entryFee: "0",
    paymentInstructions: "No requiere pago.",
    requirements: "Usuario registrado.",
    prize: "",
    startDate: "",
    endDate: "",
    drawAt: "",
    numberPoolSize: "100",
    status: "draft" as Raffle["status"],
    seoTitle: "",
    seoDescription: "",
    seoOgImage: ""
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [liveVerification, setLiveVerification] = useState<Record<string, unknown> | null>(null);

  const raffleTitleMap = useMemo(() => {
    const mapped = new Map<string, string>();
    for (const raffle of raffles) {
      mapped.set(raffle.id, raffle.title);
    }
    return mapped;
  }, [raffles]);

  const filteredNumbers = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.numbers.filter((item) => {
      const statusOk = numberStatusFilter === "all" || item.status === numberStatusFilter;
      const target = numberSearch.trim().toLowerCase();
      const searchOk = !target
        ? true
        : String(item.numberValue).includes(target) || (item.customerEmail?.toLowerCase().includes(target) ?? false);
      return statusOk && searchOk;
    });
  }, [numberSearch, numberStatusFilter, snapshot]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      rulesText: "",
      imageUrl: "",
      ctaLabel: "",
      ctaHref: "",
      isFree: true,
      entryFee: "0",
      paymentInstructions: "No requiere pago.",
      requirements: "Usuario registrado.",
      prize: "",
      startDate: "",
      endDate: "",
      drawAt: "",
      numberPoolSize: "100",
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      seoOgImage: ""
    });
    setEditingRaffleId(null);
    setSettings(createDefaultSettingsDraft());
  }

  function syncSettingsFromRaffle(raffle: Raffle | null) {
    if (!raffle) {
      return;
    }

    setSettings({
      publicParticipantsEnabled: raffle.publicParticipantsEnabled ?? false,
      publicParticipantsMode: raffle.publicParticipantsMode ?? "masked",
      publicNumbersVisibility: raffle.publicNumbersVisibility ?? true,
      publicNumberGridMode: raffle.publicNumberGridMode ?? "full",
      publicWinnerName: raffle.publicWinnerName ?? false,
      verificationMode: raffle.verificationMode ?? "commit_reveal",
      referralEnabled: raffle.referralEnabled ?? true,
      viralCounterEnabled: raffle.viralCounterEnabled ?? true,
      publicActivityEnabled: raffle.publicActivityEnabled ?? true,
      liveDrawEnabled: raffle.liveDrawEnabled ?? true,
      urgencyMessage: raffle.urgencyMessage ?? "",
      publicSubtitle: raffle.publicSubtitle ?? "",
      publicCtaLabel: raffle.publicCtaLabel ?? raffle.ctaLabel ?? "",
      promoBadgesText: (raffle.promoBadges ?? []).join("\n"),
      prizeIncludesText: (raffle.prizeIncludes ?? []).join("\n"),
      howToJoinText: (raffle.howToJoinItems ?? []).join("\n"),
      faqText: faqItemsToText(raffle.faqItems),
      paymentMethods: buildPaymentMethodsForSettings(raffle),
      paymentLinksNote: raffle.paymentLinksNote ?? ""
    });
  }

  function startEdit(raffle: Raffle) {
    setEditingRaffleId(raffle.id);
    setFeedback(null);
    setError(null);
    setForm({
      title: raffle.title,
      description: raffle.description,
      rulesText: raffle.rulesText ?? "",
      imageUrl: raffle.imageUrl ?? "",
      ctaLabel: raffle.ctaLabel ?? "",
      ctaHref: raffle.ctaHref ?? "",
      isFree: raffle.isFree,
      entryFee: String(raffle.entryFee),
      paymentInstructions: raffle.paymentInstructions,
      requirements: raffle.requirements,
      prize: raffle.prize,
      startDate: raffle.startDate.slice(0, 10),
      endDate: raffle.endDate.slice(0, 10),
      drawAt: toLocalDateTime(raffle.drawAt),
      numberPoolSize: String(raffle.numberPoolSize),
      status: raffle.status,
      seoTitle: raffle.seoTitle ?? "",
      seoDescription: raffle.seoDescription ?? "",
      seoOgImage: raffle.seoOgImage ?? ""
    });
    syncSettingsFromRaffle(raffle);
    setSelectedRaffleId(raffle.id);
  }

  async function refreshBase() {
    const response = await fetch("/api/admin/raffles", { cache: "no-store" });
    const payload = (await response.json()) as { raffles: Raffle[]; entries: RaffleEntry[]; message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudieron cargar rifas");
    }
    setRaffles(payload.raffles);
    setEntries(payload.entries);
  }

  async function refreshSnapshot() {
    if (!selectedRaffleId) {
      setSnapshot(null);
      return;
    }

    setLoadingSnapshot(true);
    try {
      const response = await fetch(`/api/admin/raffles?raffleId=${selectedRaffleId}`, { cache: "no-store" });
      const payload = (await response.json()) as SnapshotResponse & { message?: string };
      if (!response.ok || !payload.snapshot) {
        throw new Error(payload.message ?? "No se pudo cargar el snapshot de rifa");
      }

      setSnapshot(payload.snapshot);
      setSelectedNumbers([]);
      setLiveVerification(null);
      syncSettingsFromRaffle(payload.snapshot.raffle);
    } catch (snapshotError) {
      setError(snapshotError instanceof Error ? snapshotError.message : "No se pudo cargar snapshot");
      setSnapshot(null);
    } finally {
      setLoadingSnapshot(false);
    }
  }

  useEffect(() => {
    void refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRaffleId]);

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    setError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("slug", form.title || "raffle");

      const response = await fetch("/api/admin/uploads/raffle-banner", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "No se pudo subir banner");
      }

      setForm((current) => ({ ...current, imageUrl: payload.url ?? "" }));
      setFeedback("Banner subido y asignado a la rifa.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  function buildPaymentMethodsPayload() {
    return settings.paymentMethods
      .map((method, index) => ({
        provider: method.provider.trim().toLowerCase(),
        enabled: Boolean(method.enabled),
        label: method.label.trim(),
        instructions: method.instructions?.trim() || undefined,
        destinationValue: method.destinationValue?.trim() || undefined,
        href: method.href?.trim() || undefined,
        displayOrder: Number.isFinite(method.displayOrder) ? Number(method.displayOrder) : index,
        requiresReference: Boolean(method.requiresReference),
        requiresScreenshot: Boolean(method.requiresScreenshot),
        isAutomatic: Boolean(method.isAutomatic),
        config: method.config ?? {}
      }))
      .filter((method) => method.provider && method.label);
  }

  async function saveRaffle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      const drawAtDate = new Date(form.drawAt);
      if (Number.isNaN(drawAtDate.getTime())) {
        throw new Error("Define una fecha/hora válida para anunciar el ganador");
      }

      const paymentMethodsPayload = buildPaymentMethodsPayload();
      const paymentLinksPayload = paymentMethodsPayload
        .filter((method) => method.enabled && method.href)
        .map((method) => ({
          key: method.provider,
          label: method.label,
          href: method.href!,
          active: true
        }));

      const payload = {
        title: form.title,
        description: form.description,
        rulesText: form.rulesText || undefined,
        imageUrl: form.imageUrl || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        isFree: form.isFree,
        entryFee: form.isFree ? 0 : Number(form.entryFee || 0),
        paymentInstructions: form.paymentInstructions,
        requirements: form.requirements,
        prize: form.prize,
        startDate: form.startDate,
        endDate: form.endDate,
        drawAt: drawAtDate.toISOString(),
        numberPoolSize: Number(form.numberPoolSize || 1),
        status: form.status,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoOgImage: form.seoOgImage || undefined,
        ...settings,
        publicSubtitle: settings.publicSubtitle.trim() || undefined,
        publicCtaLabel: settings.publicCtaLabel.trim() || undefined,
        promoBadges: toLines(settings.promoBadgesText),
        prizeIncludes: toLines(settings.prizeIncludesText),
        howToJoinItems: toLines(settings.howToJoinText),
        faqItems: parseFaqText(settings.faqText),
        paymentMethods: paymentMethodsPayload,
        paymentLinks: paymentLinksPayload,
        paymentLinksNote: settings.paymentLinksNote.trim() || undefined
      };

      const response = await fetch(editingRaffleId ? `/api/admin/raffles/${editingRaffleId}` : "/api/admin/raffles", {
        method: editingRaffleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? `No se pudo ${editingRaffleId ? "actualizar" : "crear"} el sorteo`);
      }

      await refreshBase();
      setFeedback(editingRaffleId ? "Sorteo actualizado correctamente." : "Sorteo guardado correctamente.");
      if (!editingRaffleId) {
        resetForm();
      }
      await refreshSnapshot();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Error inesperado";
      setError(message);
    }
  }

  async function removeRaffle(raffleId: string) {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/${raffleId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar el sorteo");
      return;
    }

    if (editingRaffleId === raffleId) {
      resetForm();
    }

    await refreshBase();
    if (selectedRaffleId === raffleId) {
      setSelectedRaffleId("");
      setSnapshot(null);
    }
    setFeedback("Sorteo eliminado.");
  }

  async function updateEntry(entryId: string, nextStatus: RaffleEntry["status"]) {
    setFeedback(null);
    setError(null);
    const response = await fetch(`/api/admin/raffles/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (response.ok) {
      await refreshBase();
      await refreshSnapshot();
      setFeedback("Estado de participación actualizado.");
      return;
    }

    const payload = (await response.json()) as { message?: string };
    setError(payload.message ?? "No se pudo actualizar la participación");
  }

  async function updateRaffleStatus(raffleId: string, nextStatus: Raffle["status"]) {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/${raffleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo actualizar el estado");
      return;
    }

    await refreshBase();
    await refreshSnapshot();
    setFeedback(`Sorteo actualizado a "${nextStatus}".`);
  }

  async function drawWinner(raffleId: string) {
    setFeedback(null);
    setError(null);
    setDrawingId(raffleId);

    try {
      const response = await fetch(`/api/admin/raffles/${raffleId}/draw`, { method: "POST" });
      const payload = (await response.json()) as {
        message?: string;
        winner?: { customerEmail: string; chosenNumber: number } | null;
        verification?: Record<string, unknown>;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo ejecutar el sorteo");
      }

      await refreshBase();
      await refreshSnapshot();
      setLiveVerification(payload.verification ?? null);

      if (payload.winner) {
        setFeedback(`Ganador: ${payload.winner.customerEmail} con el número #${payload.winner.chosenNumber}.`);
      } else {
        setFeedback("Sorteo cerrado sin participaciones confirmadas.");
      }
    } catch (drawError) {
      const message = drawError instanceof Error ? drawError.message : "Error inesperado";
      setError(message);
    } finally {
      setDrawingId(null);
    }
  }

  async function executeBulkAction() {
    if (!selectedRaffleId || selectedNumbers.length === 0) {
      setError("Selecciona números para aplicar acción masiva");
      return;
    }

    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/${selectedRaffleId}/numbers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numbers: selectedNumbers,
        action: bulkAction,
        note: bulkNote || undefined,
        blockedReason: bulkReason || undefined
      })
    });

    const payload = (await response.json()) as { message?: string; affected?: number };
    if (!response.ok) {
      setError(payload.message ?? "No se pudieron actualizar números");
      return;
    }

    await refreshSnapshot();
    setFeedback(`Acción aplicada a ${payload.affected ?? selectedNumbers.length} número(s).`);
    setSelectedNumbers([]);
    setBulkNote("");
    setBulkReason("");
  }

  async function submitOfflineSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRaffleId) {
      setError("Selecciona una rifa");
      return;
    }

    setFeedback(null);
    setError(null);

    const numbers = offlineSale.numbers
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);

    const response = await fetch(`/api/admin/raffles/${selectedRaffleId}/offline-sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: offlineSale.fullName,
        email: offlineSale.email,
        phone: offlineSale.phone || undefined,
        quantity: Number(offlineSale.quantity || 1),
        numbers: numbers.length ? numbers : undefined,
        randomAssignment: offlineSale.randomAssignment,
        paymentMethod: offlineSale.paymentMethod,
        amount: offlineSale.amount ? Number(offlineSale.amount) : undefined,
        paymentReference: offlineSale.paymentReference || undefined,
        note: offlineSale.note || undefined,
        markAsConfirmed: offlineSale.markAsConfirmed
      })
    });

    const payload = (await response.json()) as { message?: string; numbers?: number[] };

    if (!response.ok) {
      setError(payload.message ?? "No se pudo registrar venta offline");
      return;
    }

    await refreshBase();
    await refreshSnapshot();
    setFeedback(`Venta offline registrada. Números: ${(payload.numbers ?? []).map((n) => `#${n}`).join(", ")}`);
    setOfflineSale({
      fullName: "",
      email: "",
      phone: "",
      quantity: "1",
      numbers: "",
      randomAssignment: true,
      paymentMethod: "zelle",
      amount: "",
      paymentReference: "",
      note: "",
      markAsConfirmed: true
    });
  }

  async function updatePaymentStatus(paymentId: string, status: "approved" | "rejected" | "cancelled") {
    setFeedback(null);
    setError(null);

    const response = await fetch(`/api/admin/raffles/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        manuallyVerified: status === "approved"
      })
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "No se pudo actualizar pago");
      return;
    }

    await refreshBase();
    await refreshSnapshot();
    setFeedback("Pago manual actualizado.");
  }

  async function saveVisibilitySettings() {
    if (!selectedRaffleId) {
      setError("Selecciona una rifa");
      return;
    }

    setFeedback(null);
    setError(null);
    const paymentMethodsPayload = buildPaymentMethodsPayload();
    const paymentLinksPayload = paymentMethodsPayload
      .filter((method) => method.enabled && method.href)
      .map((method) => ({
        key: method.provider,
        label: method.label,
        href: method.href!,
        active: true
      }));

    const response = await fetch(`/api/admin/raffles/${selectedRaffleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        publicSubtitle: settings.publicSubtitle.trim() || undefined,
        publicCtaLabel: settings.publicCtaLabel.trim() || undefined,
        promoBadges: toLines(settings.promoBadgesText),
        prizeIncludes: toLines(settings.prizeIncludesText),
        howToJoinItems: toLines(settings.howToJoinText),
        faqItems: parseFaqText(settings.faqText),
        paymentMethods: paymentMethodsPayload,
        paymentLinks: paymentLinksPayload,
        paymentLinksNote: settings.paymentLinksNote.trim() || undefined
      })
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "No se pudieron guardar ajustes");
      return;
    }

    await refreshBase();
    await refreshSnapshot();
    setFeedback("Ajustes de visibilidad y draw guardados.");
  }

  function updatePaymentMethodAt(index: number, patch: Partial<PaymentMethodDraft>) {
    setSettings((current) => {
      const nextMethods = [...current.paymentMethods];
      const target = nextMethods[index];
      if (!target) {
        return current;
      }
      nextMethods[index] = { ...target, ...patch };
      return { ...current, paymentMethods: nextMethods };
    });
  }

  function addCustomPaymentMethod() {
    setSettings((current) => ({
      ...current,
      paymentMethods: [
        ...current.paymentMethods,
        {
          provider: "other",
          enabled: false,
          label: "Otro",
          instructions: "",
          destinationValue: "",
          href: "",
          displayOrder: current.paymentMethods.length,
          requiresReference: true,
          requiresScreenshot: false,
          isAutomatic: false,
          config: {}
        }
      ]
    }));
  }

  function removePaymentMethod(index: number) {
    setSettings((current) => {
      if (current.paymentMethods.length <= 1) {
        return current;
      }
      return {
        ...current,
        paymentMethods: current.paymentMethods.filter((_, currentIndex) => currentIndex !== index)
      };
    });
  }

  function toggleNumberSelection(number: number) {
    setSelectedNumbers((current) =>
      current.includes(number) ? current.filter((item) => item !== number) : [...current, number]
    );
  }

  return (
    <>
      <form onSubmit={saveRaffle} className="card">
        <h3>{editingRaffleId ? "Editar sorteo/rifa" : "Crear sorteo/rifa"}</h3>
        <div className="request-grid">
          <label>
            Título
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Premio
            <input value={form.prize} onChange={(event) => setForm({ ...form, prize: event.target.value })} required />
          </label>
          <label className="request-full">
            Descripción
            <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>
          <label className="request-full">
            Reglas
            <textarea rows={3} value={form.rulesText} onChange={(event) => setForm({ ...form, rulesText: event.target.value })} />
          </label>
          <label>
            Imagen URL
            <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          </label>
          <label>
            Subir banner
            <input
              type="file"
              accept="image/*"
              disabled={uploadingBanner}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  void handleBannerUpload(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </label>
          {uploadingBanner ? <p className="muted request-full">Subiendo banner...</p> : null}
          {form.imageUrl ? (
            <div className="request-full">
              <p className="muted">Preview banner</p>
              <img src={toPublicImageSrc(form.imageUrl)} alt="Preview banner rifa" className="trip-card-image" />
            </div>
          ) : null}
          <label>
            CTA label
            <input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
          </label>
          <label>
            CTA href
            <input value={form.ctaHref} onChange={(event) => setForm({ ...form, ctaHref: event.target.value })} />
          </label>
          <label>
            Modalidad
            <select value={form.isFree ? "free" : "paid"} onChange={(event) => setForm({ ...form, isFree: event.target.value === "free" })}>
              <option value="free">Gratis</option>
              <option value="paid">Pago por entrada</option>
            </select>
          </label>
          <label>
            Costo de entrada (USD)
            <input
              type="number"
              min={0}
              value={form.entryFee}
              onChange={(event) => setForm({ ...form, entryFee: event.target.value })}
              disabled={form.isFree}
            />
          </label>
          <label>
            Inicio
            <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
          </label>
          <label>
            Cierre
            <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required />
          </label>
          <label>
            Anuncio ganador
            <input
              type="datetime-local"
              value={form.drawAt}
              onChange={(event) => setForm({ ...form, drawAt: event.target.value })}
              required
            />
          </label>
          <label>
            Cantidad de números
            <input
              type="number"
              min={1}
              max={5000}
              value={form.numberPoolSize}
              onChange={(event) => setForm({ ...form, numberPoolSize: event.target.value })}
              required
            />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Raffle["status"] })}>
              <option value="draft">Draft</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>
          <label>
            Requisitos
            <input value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} required />
          </label>
          <label className="request-full">
            Instrucciones de pago
            <textarea
              rows={3}
              value={form.paymentInstructions}
              onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })}
              required
            />
          </label>
        </div>
        <div className="button-row">
          <button className="button-dark" type="submit">
            {editingRaffleId ? "Actualizar sorteo" : "Guardar sorteo/rifa"}
          </button>
          {editingRaffleId ? (
            <button className="button-outline" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>

      <section className="card section">
        <div className="table-head-row">
          <div>
            <h3>Sorteos y rifas</h3>
            <p className="muted">Selecciona una rifa para abrir control completo de números, ventas offline, draw y auditoría.</p>
          </div>
          <label>
            Rifa activa en panel
            <select value={selectedRaffleId} onChange={(event) => setSelectedRaffleId(event.target.value)}>
              <option value="">Seleccionar...</option>
              {raffles.map((raffle) => (
                <option key={raffle.id} value={raffle.id}>{raffle.title}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Costo</th>
                <th>Números</th>
                <th>Estado</th>
                <th>Anuncio</th>
                <th>Ganador</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {raffles.map((raffle) => (
                <tr key={raffle.id}>
                  <td>{raffle.title}</td>
                  <td>{raffle.isFree ? "Gratis" : raffle.entryFee}</td>
                  <td>{raffle.numberPoolSize}</td>
                  <td>{raffle.status}</td>
                  <td>{new Date(raffle.drawAt).toLocaleString("es-ES")}</td>
                  <td>{raffle.winnerNumber ? `#${raffle.winnerNumber}` : "-"}</td>
                  <td>
                    <div className="button-row">
                      <button className="button-dark" type="button" onClick={() => startEdit(raffle)}>
                        Editar
                      </button>
                      <button
                        className="button-outline"
                        type="button"
                        disabled={Boolean(raffle.drawnAt)}
                        onClick={() =>
                          void updateRaffleStatus(raffle.id, raffle.status === "published" ? "closed" : "published")
                        }
                      >
                        {raffle.drawnAt ? "Finalizado" : raffle.status === "published" ? "Cerrar" : "Publicar"}
                      </button>
                      <button
                        className="button-dark"
                        type="button"
                        disabled={Boolean(raffle.drawnAt) || drawingId === raffle.id || raffle.status === "draft"}
                        onClick={() => void drawWinner(raffle.id)}
                      >
                        {raffle.drawnAt
                          ? "Sorteado"
                          : raffle.status === "draft"
                            ? "Publica primero"
                            : drawingId === raffle.id
                              ? "Sorteando..."
                              : "Sortear"}
                      </button>
                      <button className="button-outline" type="button" onClick={() => void removeRaffle(raffle.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRaffleId ? (
        <section className="card section">
          <div className="travel-tabs">
            <button className={activeTab === "overview" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("overview")}>Overview</button>
            <button className={activeTab === "numbers" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("numbers")}>Números</button>
            <button className={activeTab === "entries" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("entries")}>Participaciones</button>
            <button className={activeTab === "payments" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("payments")}>Pagos/Offline</button>
            <button className={activeTab === "referrals" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("referrals")}>Referidos</button>
            <button className={activeTab === "live" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("live")}>Live Draw</button>
            <button className={activeTab === "settings" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("settings")}>Ajustes</button>
            <button className={activeTab === "audit" ? "button-dark" : "button-outline"} type="button" onClick={() => setActiveTab("audit")}>Auditoría</button>
          </div>

          {loadingSnapshot ? <p className="muted">Cargando snapshot...</p> : null}

          {snapshot && activeTab === "overview" ? (
            <div className="kpi-grid">
              <article className="admin-card"><p className="kpi-title">Disponibles</p><p className="kpi-value">{snapshot.metrics.available}</p></article>
              <article className="admin-card"><p className="kpi-title">Vendidos</p><p className="kpi-value">{snapshot.metrics.sold + snapshot.metrics.winners}</p></article>
              <article className="admin-card"><p className="kpi-title">Reservados</p><p className="kpi-value">{snapshot.metrics.reserved + snapshot.metrics.pendingManualReview}</p></article>
              <article className="admin-card"><p className="kpi-title">Bloqueados</p><p className="kpi-value">{snapshot.metrics.blocked}</p></article>
              <article className="admin-card"><p className="kpi-title">Participaciones confirmadas</p><p className="kpi-value">{snapshot.metrics.confirmedEntries}</p></article>
              <article className="admin-card"><p className="kpi-title">Entradas offline</p><p className="kpi-value">{snapshot.metrics.offlineEntries}</p></article>
            </div>
          ) : null}

          {snapshot && activeTab === "numbers" ? (
            <>
              <div className="filter-row">
                <label>
                  Buscar número/email
                  <input value={numberSearch} onChange={(event) => setNumberSearch(event.target.value)} placeholder="Ej: 24 o email" />
                </label>
                <label>
                  Estado
                  <select value={numberStatusFilter} onChange={(event) => setNumberStatusFilter(event.target.value)}>
                    <option value="all">Todos</option>
                    <option value="available">available</option>
                    <option value="blocked">blocked</option>
                    <option value="reserved">reserved</option>
                    <option value="pending_manual_review">pending_manual_review</option>
                    <option value="sold">sold</option>
                    <option value="cancelled">cancelled</option>
                    <option value="winner">winner</option>
                  </select>
                </label>
                <label>
                  Acción masiva
                  <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)}>
                    <option value="block">Bloquear</option>
                    <option value="unblock">Desbloquear</option>
                    <option value="reserve">Reservar</option>
                    <option value="mark_sold">Marcar vendido</option>
                    <option value="cancel">Cancelar</option>
                  </select>
                </label>
                <label>
                  Nota
                  <input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} />
                </label>
                <label>
                  Razón bloqueo
                  <input value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} />
                </label>
              </div>

              <div className="button-row">
                <button className="button-dark" type="button" onClick={() => void executeBulkAction()}>
                  Aplicar a {selectedNumbers.length} número(s)
                </button>
                <button className="button-outline" type="button" onClick={() => setSelectedNumbers([])}>
                  Limpiar selección
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Número</th>
                      <th>Estado</th>
                      <th>Email</th>
                      <th>Source</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNumbers.map((number) => (
                      <tr key={number.id}>
                        <td>
                          <input type="checkbox" checked={selectedNumbers.includes(number.numberValue)} onChange={() => toggleNumberSelection(number.numberValue)} />
                        </td>
                        <td>#{number.numberValue}</td>
                        <td>{number.status}</td>
                        <td>{number.customerEmail ?? "-"}</td>
                        <td>{number.source}</td>
                        <td>{number.adminNote ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {snapshot && activeTab === "entries" ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Correo</th>
                    <th>Número</th>
                    <th>Source</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.customerEmail}</td>
                      <td>#{entry.chosenNumber}</td>
                      <td>{entry.source ?? "online"}</td>
                      <td>{entry.paymentMethod ?? "-"}</td>
                      <td>{entry.status}</td>
                      <td>
                        <div className="button-row">
                          <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "confirmed")}>Confirmar</button>
                          <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "rejected")}>Rechazar</button>
                          <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "cancelled")}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {snapshot && activeTab === "payments" ? (
            <>
              <form className="card" onSubmit={submitOfflineSale}>
                <h4>Registrar venta offline/manual</h4>
                <div className="request-grid">
                  <label>
                    Nombre completo
                    <input value={offlineSale.fullName} onChange={(event) => setOfflineSale({ ...offlineSale, fullName: event.target.value })} required />
                  </label>
                  <label>
                    Email
                    <input type="email" value={offlineSale.email} onChange={(event) => setOfflineSale({ ...offlineSale, email: event.target.value })} required />
                  </label>
                  <label>
                    Teléfono
                    <input value={offlineSale.phone} onChange={(event) => setOfflineSale({ ...offlineSale, phone: event.target.value })} />
                  </label>
                  <label>
                    Cantidad
                    <input type="number" min={1} max={100} value={offlineSale.quantity} onChange={(event) => setOfflineSale({ ...offlineSale, quantity: event.target.value })} />
                  </label>
                  <label className="request-full">
                    Números específicos (coma separada)
                    <input value={offlineSale.numbers} onChange={(event) => setOfflineSale({ ...offlineSale, numbers: event.target.value, randomAssignment: false })} placeholder="Ej: 12,25,88" />
                  </label>
                  <label>
                    Método de pago
                    <select value={offlineSale.paymentMethod} onChange={(event) => setOfflineSale({ ...offlineSale, paymentMethod: event.target.value })}>
                      <option value="paypal">paypal</option>
                      <option value="zelle">zelle</option>
                      <option value="cashapp">cashapp</option>
                      <option value="ath_movil">ath_movil</option>
                      <option value="cash">cash</option>
                      <option value="venmo">venmo</option>
                      <option value="other">other</option>
                    </select>
                  </label>
                  <label>
                    Monto
                    <input type="number" min={0} step="0.01" value={offlineSale.amount} onChange={(event) => setOfflineSale({ ...offlineSale, amount: event.target.value })} />
                  </label>
                  <label>
                    Referencia de pago
                    <input value={offlineSale.paymentReference} onChange={(event) => setOfflineSale({ ...offlineSale, paymentReference: event.target.value })} />
                  </label>
                  <label>
                    Nota admin
                    <input value={offlineSale.note} onChange={(event) => setOfflineSale({ ...offlineSale, note: event.target.value })} />
                  </label>
                  <label>
                    <input type="checkbox" checked={offlineSale.randomAssignment} onChange={(event) => setOfflineSale({ ...offlineSale, randomAssignment: event.target.checked })} />
                    Asignación random
                  </label>
                  <label>
                    <input type="checkbox" checked={offlineSale.markAsConfirmed} onChange={(event) => setOfflineSale({ ...offlineSale, markAsConfirmed: event.target.checked })} />
                    Marcar como confirmado
                  </label>
                </div>
                <button className="button-dark" type="submit">Registrar venta offline</button>
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Manual</th>
                      <th>Verificado</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.customerEmail ?? "-"}</td>
                        <td>{payment.amount}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{yesNo(payment.isManual)}</td>
                        <td>{yesNo(payment.manuallyVerified)}</td>
                        <td>{payment.status}</td>
                        <td>
                          <div className="button-row">
                            <button className="button-outline" type="button" onClick={() => void updatePaymentStatus(payment.id, "approved")}>Aprobar</button>
                            <button className="button-outline" type="button" onClick={() => void updatePaymentStatus(payment.id, "rejected")}>Rechazar</button>
                            <button className="button-outline" type="button" onClick={() => void updatePaymentStatus(payment.id, "cancelled")}>Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {snapshot && activeTab === "referrals" ? (
            <>
              <p className="muted">Tracking de referidos para esta rifa. Comparte links con parámetro <code>?ref=CODIGO</code>.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Clicks</th>
                      <th>Conversiones</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.referrals.map((referral) => (
                      <tr key={referral.referralCode}>
                        <td>{referral.referralCode}</td>
                        <td>{referral.clicks}</td>
                        <td>{referral.conversions}</td>
                        <td>{`/sorteos/${snapshot.raffle.id}?ref=${referral.referralCode}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {snapshot && activeTab === "live" ? (
            <>
              <p className="muted">Draw verificable y transparente. El sorteo usa payload hash + seed pública.</p>
              <div className="button-row">
                <button
                  className="button-dark"
                  type="button"
                  disabled={Boolean(snapshot.raffle.drawnAt) || drawingId === snapshot.raffle.id || snapshot.raffle.status === "draft"}
                  onClick={() => void drawWinner(snapshot.raffle.id)}
                >
                  {snapshot.raffle.drawnAt ? "Sorteado" : drawingId === snapshot.raffle.id ? "Sorteando..." : "Iniciar draw"}
                </button>
              </div>
              <p><strong>Draw at:</strong> {new Date(snapshot.raffle.drawAt).toLocaleString("es-ES")}</p>
              <p><strong>Drawn at:</strong> {snapshot.raffle.drawnAt ? new Date(snapshot.raffle.drawnAt).toLocaleString("es-ES") : "Pendiente"}</p>
              <p><strong>Winner:</strong> {snapshot.raffle.winnerNumber ? `#${snapshot.raffle.winnerNumber}` : "-"}</p>
              {liveVerification ? (
                <pre className="card" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(liveVerification, null, 2)}</pre>
              ) : null}
            </>
          ) : null}

          {snapshot && activeTab === "settings" ? (
            <>
              <div className="request-grid">
                <label>
                  Public participants enabled
                  <select value={String(settings.publicParticipantsEnabled)} onChange={(event) => setSettings({ ...settings, publicParticipantsEnabled: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Participants mode
                  <select
                    value={settings.publicParticipantsMode}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        publicParticipantsMode: event.target.value as RaffleSettingsDraft["publicParticipantsMode"]
                      })
                    }
                  >
                    <option value="hidden">hidden</option>
                    <option value="name_only">name_only</option>
                    <option value="name_number">name_number</option>
                    <option value="masked">masked</option>
                  </select>
                </label>
                <label>
                  Public numbers visibility
                  <select value={String(settings.publicNumbersVisibility)} onChange={(event) => setSettings({ ...settings, publicNumbersVisibility: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Grid mode
                  <select
                    value={settings.publicNumberGridMode}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        publicNumberGridMode: event.target.value as RaffleSettingsDraft["publicNumberGridMode"]
                      })
                    }
                  >
                    <option value="full">full</option>
                    <option value="available_only">available_only</option>
                    <option value="sold_only">sold_only</option>
                    <option value="totals_only">totals_only</option>
                  </select>
                </label>
                <label>
                  Mostrar ganador en público
                  <select value={String(settings.publicWinnerName)} onChange={(event) => setSettings({ ...settings, publicWinnerName: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Verification mode
                  <select
                    value={settings.verificationMode}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        verificationMode: event.target.value as RaffleSettingsDraft["verificationMode"]
                      })
                    }
                  >
                    <option value="commit_reveal">commit_reveal</option>
                    <option value="none">none</option>
                  </select>
                </label>
                <label>
                  Referral enabled
                  <select value={String(settings.referralEnabled)} onChange={(event) => setSettings({ ...settings, referralEnabled: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Viral counter enabled
                  <select value={String(settings.viralCounterEnabled)} onChange={(event) => setSettings({ ...settings, viralCounterEnabled: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Public activity enabled
                  <select value={String(settings.publicActivityEnabled)} onChange={(event) => setSettings({ ...settings, publicActivityEnabled: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label>
                  Live draw enabled
                  <select value={String(settings.liveDrawEnabled)} onChange={(event) => setSettings({ ...settings, liveDrawEnabled: event.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
                <label className="request-full">
                  Mensaje de urgencia
                  <input value={settings.urgencyMessage} onChange={(event) => setSettings({ ...settings, urgencyMessage: event.target.value })} />
                </label>
                <label className="request-full">
                  Subtítulo público del hero
                  <input
                    value={settings.publicSubtitle}
                    onChange={(event) => setSettings({ ...settings, publicSubtitle: event.target.value })}
                    placeholder="Ej: Participa por una experiencia inolvidable."
                  />
                </label>
                <label>
                  CTA público
                  <input
                    value={settings.publicCtaLabel}
                    onChange={(event) => setSettings({ ...settings, publicCtaLabel: event.target.value })}
                    placeholder="Participar ahora"
                  />
                </label>
                <label className="request-full">
                  Nota para métodos de pago
                  <input
                    value={settings.paymentLinksNote}
                    onChange={(event) => setSettings({ ...settings, paymentLinksNote: event.target.value })}
                    placeholder="Ej: Envía tu pago y coloca la referencia al participar."
                  />
                </label>
                <label className="request-full">
                  Badges promocionales (1 por línea)
                  <textarea
                    rows={3}
                    value={settings.promoBadgesText}
                    onChange={(event) => setSettings({ ...settings, promoBadgesText: event.target.value })}
                    placeholder={"Premio exclusivo\nSorteo verificado\nNúmeros limitados"}
                  />
                </label>
                <label className="request-full">
                  Qué incluye el premio (1 por línea)
                  <textarea
                    rows={3}
                    value={settings.prizeIncludesText}
                    onChange={(event) => setSettings({ ...settings, prizeIncludesText: event.target.value })}
                  />
                </label>
                <label className="request-full">
                  Cómo participar (1 paso por línea)
                  <textarea
                    rows={3}
                    value={settings.howToJoinText}
                    onChange={(event) => setSettings({ ...settings, howToJoinText: event.target.value })}
                  />
                </label>
                <label className="request-full">
                  FAQ (formato: Pregunta | Respuesta)
                  <textarea
                    rows={4}
                    value={settings.faqText}
                    onChange={(event) => setSettings({ ...settings, faqText: event.target.value })}
                    placeholder={"¿Cómo participo? | Selecciona tu número y completa el pago.\n¿Cuándo anuncian ganador? | En la fecha del countdown."}
                  />
                </label>
              </div>
              <div className="card" style={{ marginBottom: "12px" }}>
                <div className="table-head-row">
                  <div>
                    <h4>Métodos de pago por rifa</h4>
                    <p className="muted">Configura método, reglas y enlaces clickeables por sorteo.</p>
                  </div>
                  <button className="button-outline" type="button" onClick={addCustomPaymentMethod}>
                    Agregar método
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>On</th>
                        <th>Label</th>
                        <th>Provider</th>
                        <th>Destino</th>
                        <th>Link de pago</th>
                        <th>Instrucciones</th>
                        <th>Orden</th>
                        <th>Ref</th>
                        <th>Shot</th>
                        <th>Auto</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.paymentMethods.map((method, index) => (
                        <tr key={`${method.provider}-${index}`}>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(method.enabled)}
                              onChange={(event) => updatePaymentMethodAt(index, { enabled: event.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              value={method.label}
                              onChange={(event) => updatePaymentMethodAt(index, { label: event.target.value })}
                              placeholder="Ej: PayPal"
                            />
                          </td>
                          <td>
                            <input
                              value={method.provider}
                              onChange={(event) => updatePaymentMethodAt(index, { provider: event.target.value })}
                              placeholder="paypal"
                            />
                          </td>
                          <td>
                            <input
                              value={method.destinationValue ?? ""}
                              onChange={(event) => updatePaymentMethodAt(index, { destinationValue: event.target.value })}
                              placeholder="email, @tag, teléfono"
                            />
                          </td>
                          <td>
                            <input
                              value={method.href ?? ""}
                              onChange={(event) => updatePaymentMethodAt(index, { href: event.target.value })}
                              placeholder="https://..."
                            />
                          </td>
                          <td>
                            <input
                              value={method.instructions ?? ""}
                              onChange={(event) => updatePaymentMethodAt(index, { instructions: event.target.value })}
                              placeholder="Instrucciones visibles"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={method.displayOrder}
                              onChange={(event) => updatePaymentMethodAt(index, { displayOrder: Number(event.target.value || 0) })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(method.requiresReference)}
                              onChange={(event) => updatePaymentMethodAt(index, { requiresReference: event.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(method.requiresScreenshot)}
                              onChange={(event) => updatePaymentMethodAt(index, { requiresScreenshot: event.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(method.isAutomatic)}
                              onChange={(event) => updatePaymentMethodAt(index, { isAutomatic: event.target.checked })}
                            />
                          </td>
                          <td>
                            <button className="button-outline" type="button" onClick={() => removePaymentMethod(index)}>
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button className="button-dark" type="button" onClick={() => void saveVisibilitySettings()}>
                Guardar ajustes
              </button>
            </>
          ) : null}

          {snapshot && activeTab === "audit" ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>ID</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString("es-ES")}</td>
                      <td>{log.action}</td>
                      <td>{log.entityType}</td>
                      <td>{log.entityId ?? "-"}</td>
                      <td><pre>{JSON.stringify(log.metadataJson)}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card section">
        <h3>Participaciones globales</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sorteo</th>
                <th>Correo</th>
                <th>Número</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{raffleTitleMap.get(entry.raffleId) ?? entry.raffleId.slice(0, 8)}</td>
                  <td>{entry.customerEmail}</td>
                  <td>#{entry.chosenNumber}</td>
                  <td>{entry.status}</td>
                  <td>
                    <div className="button-row">
                      <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "confirmed")}>Confirmar</button>
                      <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "rejected")}>Rechazar</button>
                      <button className="button-outline" type="button" onClick={() => void updateEntry(entry.id, "cancelled")}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {feedback ? <p className="success">{feedback}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </>
  );
}
