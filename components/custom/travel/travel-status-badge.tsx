interface TravelStatusBadgeProps {
  status: string;
}

export function TravelStatusBadge({ status }: TravelStatusBadgeProps) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "approved" || normalized === "ready" || normalized === "generated"
      ? "status-badge status-paid"
      : normalized === "draft" || normalized === "internal"
        ? "status-badge status-draft"
        : "status-badge status-pending";

  return <span className={className}>{status}</span>;
}
