import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ready"
      ? "badge-ready"
      : status === "delivered"
        ? "badge-delivered"
        : "badge-pending";

  return (
    <span className={`badge ${cls}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
