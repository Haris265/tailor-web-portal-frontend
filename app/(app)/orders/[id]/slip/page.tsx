"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { getOrder } from "@/lib/api";
import {
  COAT_PANT_FIELDS,
  READY_SIZE_FIELDS,
  SHIRT_FIELDS,
  STYLE_OPTIONS,
  formatRs,
} from "@/lib/constants";
import { SHOP } from "@/lib/shop";

type OrderItem = {
  id: number;
  item_type: string;
  item_name?: string;
  qty: string;
  rate: string;
  amount: string;
  sort_order: number;
};

type Order = {
  id: number;
  order_number: string;
  sr_no: number;
  booking_date: string;
  delivery_date: string;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  status: string;
  measurement?: Record<string, unknown> | null;
  items?: OrderItem[];
  customer_detail?: {
    id: number;
    serial_number: string;
    name: string;
    phone: string;
    address?: string;
  };
};

function displayValue(val: unknown) {
  if (val === null || val === undefined || val === "" || val === 0) return "";
  return String(val);
}

function MeasureBlock({
  title,
  fields,
  data,
}: {
  title: string;
  fields: ReadonlyArray<{ name: string; label: string }>;
  data?: Record<string, unknown> | null;
}) {
  return (
    <div>
      <h4 className="mb-1 border-b border-black pb-0.5 text-[11px] font-bold uppercase tracking-wide">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 sm:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.name}
            className="flex items-baseline justify-between gap-2 border-b border-dotted border-stone-300 text-[11px]"
          >
            <span className="text-stone-600">{field.label}</span>
            <span className="min-w-[2rem] text-right font-medium">
              {displayValue(data?.[field.name])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="border-b border-black pb-2 text-center">
      <h2 className="text-xl font-bold tracking-wide">{SHOP.name}</h2>
      <p className="mt-0.5 text-[11px] text-stone-700">
        {SHOP.phones.join(" · ")}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider">
        {subtitle}
      </p>
    </header>
  );
}

function MetaRow({
  srNo,
  booking,
  delivery,
  name,
  phone,
}: {
  srNo: number | string;
  booking: string;
  delivery: string;
  name?: string;
  phone?: string;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3">
      <div>
        <span className="text-stone-500">Sr. No.</span>{" "}
        <strong>{srNo}</strong>
      </div>
      <div>
        <span className="text-stone-500">Booking</span> {booking}
      </div>
      <div>
        <span className="text-stone-500">Delivery</span> {delivery}
      </div>
      <div className="col-span-2 sm:col-span-2">
        <span className="text-stone-500">Customer</span> {name || "—"}
      </div>
      <div>
        <span className="text-stone-500">Contact</span> {phone || "—"}
      </div>
    </div>
  );
}

export default function OrderSlipPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError("Could not load this order slip."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  const customer = order.customer_detail;
  const measurement = order.measurement;
  const slipItems = [...(order.items || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl text-[#15202b]">Bill book slips</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Printer className="h-4 w-4" />
          Print both slips
        </button>
      </div>

      <div className="space-y-6 bg-white text-[#15202b] print:space-y-0">
        {/* Measurement Slip */}
        <section className="rounded-xl border border-stone-300 p-5 shadow-sm print:rounded-none print:border print:border-black print:p-3 print:shadow-none">
          <ShopHeader subtitle="Measurement Slip" />
          <MetaRow
            srNo={order.sr_no}
            booking={order.booking_date}
            delivery={order.delivery_date}
            name={customer?.name}
            phone={customer?.phone}
          />

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_180px]">
            <div className="space-y-3">
              <MeasureBlock
                title="Shirt & Shalwar Kameez"
                fields={SHIRT_FIELDS}
                data={measurement}
              />
              <MeasureBlock
                title="Ready Size"
                fields={READY_SIZE_FIELDS}
                data={measurement}
              />
              <MeasureBlock
                title="Coat & Pant"
                fields={COAT_PANT_FIELDS}
                data={measurement}
              />
            </div>

            <div>
              <h4 className="mb-1 border-b border-black pb-0.5 text-[11px] font-bold uppercase tracking-wide">
                Styles
              </h4>
              <ul className="space-y-1 text-[11px]">
                {STYLE_OPTIONS.map((style) => {
                  const on = Boolean(measurement?.[style.name]);
                  return (
                    <li key={style.name} className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-3.5 w-3.5 items-center justify-center border border-black text-[9px] ${
                          on ? "bg-black text-white" : "bg-white"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span>
                        {style.label}{" "}
                        <span dir="rtl" className="text-stone-500">
                          {style.labelUrdu}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <div className="print:hidden border-t border-dashed border-stone-300 pt-2 text-center text-xs text-stone-400">
          — tear line —
        </div>
        <div className="hidden border-t border-dashed border-black print:block" />

        {/* Customer Slip */}
        <section className="rounded-xl border border-stone-300 p-5 shadow-sm print:mt-3 print:rounded-none print:border print:border-black print:p-3 print:shadow-none">
          <ShopHeader subtitle="Customer Slip" />
          <MetaRow
            srNo={order.sr_no}
            booking={order.booking_date}
            delivery={order.delivery_date}
            name={customer?.name}
            phone={customer?.phone}
          />

          <table className="mt-3 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 pr-2">Items</th>
                <th className="w-14 py-1 pr-2">Qty</th>
                <th className="w-16 py-1 pr-2">Rate</th>
                <th className="w-20 py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {slipItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-2 text-stone-500">
                    No items
                  </td>
                </tr>
              ) : (
                slipItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-dotted border-stone-300"
                  >
                    <td className="py-1 pr-2">
                      {row.item_name || row.item_type}
                    </td>
                    <td className="py-1 pr-2">
                      {Number(row.qty) ? row.qty : ""}
                    </td>
                    <td className="py-1 pr-2">
                      {Number(row.rate) ? row.rate : ""}
                    </td>
                    <td className="py-1 text-right">
                      {Number(row.amount) ? formatRs(row.amount) : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-3 ml-auto w-full max-w-xs space-y-1 text-[11px]">
            <div className="flex justify-between border border-black px-2 py-1">
              <span className="font-semibold">TOTAL</span>
              <span>{formatRs(order.total_amount)}</span>
            </div>
            <div className="flex justify-between border border-black px-2 py-1">
              <span className="font-semibold">ADVANCE</span>
              <span>{formatRs(order.advance_paid)}</span>
            </div>
            <div className="flex justify-between border border-black px-2 py-1">
              <span className="font-semibold">BALANCE</span>
              <span>{formatRs(order.balance_due)}</span>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-stone-600">{SHOP.address}</p>
          <ul className="mt-1 space-y-0.5 text-[10px] text-stone-700" dir="rtl">
            {SHOP.termsUrdu.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
