import Link from "next/link";
import { Printer } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatRs } from "@/lib/constants";

type Order = {
  id: number;
  order_number: string;
  sr_no?: number;
  delivery_date: string;
  total_amount: string;
  balance_due: string;
  status: string;
  customer_detail?: {
    name: string;
    serial_number: string;
  };
};

export default function PendingOrders({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 py-8 text-center text-sm text-slate-500">
        No pending orders right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <p className="font-medium text-[#15202b]">
              {order.customer_detail?.name ?? "Customer"}{" "}
              <span className="text-slate-300">·</span>{" "}
              <span className="text-sm text-slate-500">
                Sr. {order.sr_no ?? order.order_number}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Due {order.delivery_date} · Balance {formatRs(order.balance_due)}
            </p>
            <div className="mt-1.5">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <Link
            href={`/orders/${order.id}/slip`}
            className="btn-secondary"
          >
            <Printer className="h-3.5 w-3.5" />
            Slip
          </Link>
        </li>
      ))}
    </ul>
  );
}
