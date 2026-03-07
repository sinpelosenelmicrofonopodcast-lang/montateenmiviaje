export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getStartingPrice(
  packages: Array<{ pricePerPerson: number } | null | undefined>,
  manualFromPrice?: number | null
) {
  const prices = packages
    .map((item) => item?.pricePerPerson ?? 0)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (prices.length > 0) {
    return Math.min(...prices);
  }

  if (typeof manualFromPrice === "number" && Number.isFinite(manualFromPrice) && manualFromPrice > 0) {
    return manualFromPrice;
  }

  return null;
}

export function getStartingDeposit(packages: Array<{ deposit: number } | null | undefined>) {
  const deposits = packages
    .map((item) => item?.deposit ?? 0)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (deposits.length === 0) {
    return null;
  }

  return Math.min(...deposits);
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

export function availabilityPercent(available: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((available / total) * 100)));
}
