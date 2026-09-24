"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Printer } from "lucide-react";
import { listOrders, updateOrder } from "@/lib/api";
import { formatRs } from "@/lib/constants";
import StatusBadge from "@/components/ui/StatusBadge";

type Order = {
  id: number;
  order_number: string;
  sr_no?: number;
  booking_date: string;
  delivery_date: string;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  status: string;
};

type Props = {
  customerId: number;
  customerName: string;
  customerSerial: string;
  pageSize?: number;
};

export default function CustomerOrderHistory({
  customerId,
  customerName,
  customerSerial,
  pageSize = 5,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setError("");
    listOrders({ customer: customerId })
      .then(({ data }) => setOrders(data))
      .catch(() => setError("Could not load order history."))
      .finally(() => setLoading(false));
  }, [customerId]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, safePage, pageSize]);

  const salesTotal = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  async function setOrderStatus(orderId: number, status: string) {
    try {
      const { data } = await updateOrder(orderId, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data } : o)));
    } catch {
      setError("Failed to update order status.");
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Customer history
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            <span className="font-semibold text-[#15202b]">{customerName}</span>
            <span className="text-slate-400"> · </span>
            <span className="font-mono text-xs text-[#a67c52]">{customerSerial}</span>
            <span className="text-slate-400"> · </span>
            {orders.length} order(s) · {formatRs(salesTotal)}
          </p>
        </div>
        <Link
          href={`/customers/${customerId}?tab=sales`}
          className="text-xs font-medium text-[#a67c52] hover:underline"
        >
          Open full profile →
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading history…
          </div>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No orders yet for this customer.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Dates</th>
                    <th>Billing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium text-[#15202b]">
                        {o.sr_no ?? o.order_number}
                      </td>
                      <td className="text-slate-500">
                        {o.booking_date} → {o.delivery_date}
                      </td>
                      <td>
                        <div>{formatRs(o.total_amount)}</div>
                        <div className="text-xs text-slate-400">
                          Bal {formatRs(o.balance_due)}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Link
                            href={`/orders/${o.id}/slip`}
                            className="btn-secondary px-2 py-1 text-xs"
                          >
                            <Printer className="h-3 w-3" />
                            Slip
                          </Link>
                          {o.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => setOrderStatus(o.id, "ready")}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Ready
                            </button>
                          ) : null}
                          {o.status !== "delivered" ? (
                            <button
                              type="button"
                              onClick={() => setOrderStatus(o.id, "delivered")}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Delivered
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Page {safePage} of {totalPages} · showing{" "}
                  {(safePage - 1) * pageSize + 1}–
                  {Math.min(safePage * pageSize, orders.length)} of {orders.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary px-2 py-1 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`min-w-8 rounded-lg px-2 py-1 text-xs font-semibold ${
                        n === safePage
                          ? "bg-[#15202b] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn-secondary px-2 py-1 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
