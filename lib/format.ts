export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
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
