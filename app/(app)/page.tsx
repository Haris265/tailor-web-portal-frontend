"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  Ruler,
  Clock,
  CheckCircle2,
  PackageCheck,
  Banknote,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getDashboardStats, listOrders, updateOrder } from "@/lib/api";
import { formatRs } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import CustomerSearch, {
  CustomerSuggestion,
} from "@/components/CustomerSearch";
import CustomerOrderHistory from "@/components/CustomerOrderHistory";

type Stats = {
  customers_count: number;
  measurements_count: number;
  orders_pending: number;
  orders_ready: number;
  orders_delivered: number;
  sales_total: string;
  advance_total: string;
  balance_total: string;
};

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
  customer_detail?: {
    id: number;
    name: string;
    serial_number: string;
  };
};

type StatusFilter = "" | "pending" | "ready" | "delivered";

function DashboardContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [fullResults, setFullResults] = useState<CustomerSuggestion[] | null>(
    null
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSuggestion | null>(null);
  const [matchPage, setMatchPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const historyRef = useRef<HTMLElement>(null);
  const salesRef = useRef<HTMLDivElement>(null);
  const customerHistoryRef = useRef<HTMLDivElement>(null);

  const MATCH_PAGE_SIZE = 6;

  const matchTotalPages = Math.max(
    1,
    Math.ceil((fullResults?.length ?? 0) / MATCH_PAGE_SIZE)
  );
  const matchSafePage = Math.min(matchPage, matchTotalPages);
  const pagedMatches = useMemo(() => {
    if (!fullResults) return [];
    const start = (matchSafePage - 1) * MATCH_PAGE_SIZE;
    return fullResults.slice(start, start + MATCH_PAGE_SIZE);
  }, [fullResults, matchSafePage]);

  function selectCustomer(c: CustomerSuggestion) {
    setSelectedCustomer(c);
    setTimeout(() => {
      customerHistoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function handleSubmitSearch(_q: string, results: CustomerSuggestion[]) {
    setFullResults(results);
    setMatchPage(1);
    if (results.length === 1) {
      selectCustomer(results[0]);
    } else {
      setSelectedCustomer(null);
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const dateParams: Record<string, string> = {};
    if (dateFrom) dateParams.from = dateFrom;
    if (dateTo) dateParams.to = dateTo;

    try {
      const [statsRes, ordersRes] = await Promise.all([
        getDashboardStats(dateParams),
        listOrders(statusFilter ? { status: statusFilter } : {}),
      ]);
      setStats(statsRes.data);

      let list: Order[] = ordersRes.data;
      if (dateFrom) list = list.filter((o) => o.booking_date >= dateFrom);
      if (dateTo) list = list.filter((o) => o.booking_date <= dateTo);
      setOrders(list);
    } catch {
      setError("Could not load dashboard. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function applyStatusFilter(status: StatusFilter) {
    setStatusFilter(status);
    setTimeout(() => {
      historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function focusSales() {
    setStatusFilter("");
    setTimeout(() => {
      salesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function setOrderStatus(orderId: number, status: string) {
    try {
      const { data } = await updateOrder(orderId, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data } : o)));
      const statsRes = await getDashboardStats({
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      });
      setStats(statsRes.data);
    } catch {
      setError("Failed to update order status.");
    }
  }

  const chips: { value: StatusFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "ready", label: "Ready" },
    { value: "delivered", label: "Delivered" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Dashboard"
        description="Shop overview, customer lookup, and order pipeline."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/customers/new" className="btn-secondary w-full justify-center sm:w-auto">
              New customer
            </Link>
            <Link href="/orders/new" className="btn-primary w-full justify-center sm:w-auto">
              New booking
            </Link>
          </div>
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setStatusFilter(c.value)}
              className={`rounded-full px-3.5 py-2.5 text-xs font-semibold transition ${
                statusFilter === c.value
                  ? "bg-[#15202b] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#a67c52] hover:text-[#15202b]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-pro w-auto"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-pro w-auto"
            />
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading analytics…
        </div>
      ) : stats ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Customers"
              value={stats.customers_count}
              icon={Users}
              href="/customers"
            />
            <StatCard
              label="Measurements"
              value={stats.measurements_count}
              icon={Ruler}
              href="/customers"
            />
            <StatCard
              label="Pending"
              value={stats.orders_pending}
              icon={Clock}
              onClick={() => applyStatusFilter("pending")}
              active={statusFilter === "pending"}
            />
            <StatCard
              label="Ready"
              value={stats.orders_ready}
              icon={CheckCircle2}
              onClick={() => applyStatusFilter("ready")}
              active={statusFilter === "ready"}
            />
            <StatCard
              label="Delivered"
              value={stats.orders_delivered}
              icon={PackageCheck}
              onClick={() => applyStatusFilter("delivered")}
              active={statusFilter === "delivered"}
            />
            <StatCard
              label="Total sales"
              value={formatRs(stats.sales_total)}
              icon={Banknote}
              accent
              onClick={focusSales}
            />
          </div>

          <div
            ref={salesRef}
            className="mb-8 grid gap-3 sm:grid-cols-3"
          >
            <div className="panel p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sales (filtered)
              </p>
              <p className="mt-1 font-serif text-xl text-[#15202b]">
                {formatRs(stats.sales_total)}
              </p>
            </div>
            <div className="panel p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Advance collected
              </p>
              <p className="mt-1 font-serif text-xl text-[#15202b]">
                {formatRs(stats.advance_total)}
              </p>
            </div>
            <div className="panel p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Balance due
              </p>
              <p className="mt-1 font-serif text-xl text-[#15202b]">
                {formatRs(stats.balance_total)}
              </p>
            </div>
          </div>
        </>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Quick customer search
        </h2>
        <CustomerSearch
          navigateOnSelect={false}
          onSelect={selectCustomer}
          onSubmitSearch={handleSubmitSearch}
        />
        <p className="mt-2 text-xs text-slate-500">
          Pick a customer to see their order history below. Suggestions show name,
          serial, and phone.
        </p>

        {fullResults ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              All matches ({fullResults.length})
            </p>
            {fullResults.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No customers matched.
              </p>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pagedMatches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className={`panel flex items-start justify-between gap-3 p-3 text-left transition hover:border-[rgba(166,124,82,0.45)] ${
                        selectedCustomer?.id === c.id
                          ? "ring-2 ring-[rgba(166,124,82,0.45)] border-[rgba(166,124,82,0.4)]"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#15202b]">{c.name}</p>
                        <p className="text-sm text-slate-400">{c.phone}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#f4f6f8] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#a67c52]">
                        {c.serial_number}
                      </span>
                    </button>
                  ))}
                </div>
                {matchTotalPages > 1 ? (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                      Page {matchSafePage} of {matchTotalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={matchSafePage <= 1}
                        onClick={() => setMatchPage((p) => Math.max(1, p - 1))}
                        className="btn-secondary px-2 py-1 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={matchSafePage >= matchTotalPages}
                        onClick={() =>
                          setMatchPage((p) => Math.min(matchTotalPages, p + 1))
                        }
                        className="btn-secondary px-2 py-1 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {selectedCustomer ? (
          <div ref={customerHistoryRef}>
            <CustomerOrderHistory
              customerId={selectedCustomer.id}
              customerName={selectedCustomer.name}
              customerSerial={selectedCustomer.serial_number}
              pageSize={5}
            />
          </div>
        ) : null}
      </section>

      <section ref={historyRef}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Order history
          </h2>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
        </div>
        <div className="panel overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No orders match these filters.
            </p>
          ) : (
            <>
            <div className="divide-y divide-slate-100 md:hidden">
              {orders.map((o) => (
                <div key={o.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#15202b]">
                        {o.sr_no ?? o.order_number}
                      </p>
                      {o.customer_detail ? (
                        <Link
                          href={`/customers/${o.customer_detail.id}`}
                          className="mt-0.5 block text-sm hover:text-[#a67c52]"
                        >
                          {o.customer_detail.name}
                          <span className="block text-xs text-slate-500">
                            {o.customer_detail.serial_number}
                          </span>
                        </Link>
                      ) : null}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>Delivery {o.delivery_date}</span>
                    <span>
                      {formatRs(o.total_amount)} · Bal {formatRs(o.balance_due)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      href={`/orders/${o.id}/slip`}
                      className="btn-secondary min-h-10 justify-center px-3 text-xs"
                    >
                      <Printer className="h-3 w-3" />
                      Slip
                    </Link>
                    {o.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => setOrderStatus(o.id, "ready")}
                        className="btn-secondary min-h-10 justify-center px-3 text-xs"
                      >
                        Ready
                      </button>
                    ) : null}
                    {o.status !== "delivered" ? (
                      <button
                        type="button"
                        onClick={() => setOrderStatus(o.id, "delivered")}
                        className="btn-secondary min-h-10 justify-center px-3 text-xs"
                      >
                        Delivered
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Customer</th>
                    <th>Delivery</th>
                    <th>Billing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium text-[#15202b]">
                        {o.sr_no ?? o.order_number}
                      </td>
                      <td>
                        {o.customer_detail ? (
                          <Link
                            href={`/customers/${o.customer_detail.id}`}
                            className="hover:text-[#a67c52]"
                          >
                            {o.customer_detail.name}
                            <span className="block text-xs text-slate-500">
                              {o.customer_detail.serial_number}
                            </span>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-slate-400">{o.delivery_date}</td>
                      <td>
                        <div>{formatRs(o.total_amount)}</div>
                        <div className="text-xs text-slate-500">
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
